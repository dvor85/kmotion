#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators


"""
Called by the kmotion exe file this module re-initialises the kmotion core then
reloads the kmotion daemon configs

The kmotion exe file cannot call this code directly because it may be in a
different working directory
"""

import os
import signal
import time

import subprocess
from motion_daemon import MotionDaemon
from core.init_core import InitCore
from kmotion_hkd1 import Kmotion_Hkd1
from kmotion_hkd2 import Kmotion_Hkd2
from kmotion_setd import Kmotion_setd
from kmotion_split import Kmotion_split
from motion_detector_monitor import Detector
from httpd_server_notice import HttpServerNotice
from core import logger, utils
from core.config import Settings

log = logger.getLogger('kmotion', logger.ERROR)
www_logs = logger.getLogger('www_logs', logger.DEBUG)


class exit_(Exception):
    pass


class Kmotion:

    def __init__(self, kmotion_dir):
        self.pid = os.getpid()
        self.kmotion_dir = kmotion_dir
        self.active = False

        signal.signal(signal.SIGTERM, self.signal_term)
        self.pidfile = '/run/kmotion/kmotion.pid'

        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.ramdisk_dir = config_main['ramdisk_dir']

        self.init_core = InitCore(self.kmotion_dir)

#         self.motion_daemon = MotionDaemon(self.kmotion_dir)

        self.daemons = []
        self.daemons.append(MotionDaemon(self.kmotion_dir))
        self.daemons.append(Kmotion_Hkd1(self.kmotion_dir))
        self.daemons.append(Kmotion_Hkd2(self.kmotion_dir))
        self.daemons.append(Kmotion_setd(self.kmotion_dir))
        self.daemons.append(Kmotion_split(self.kmotion_dir))
        self.daemons.append(Detector(self.kmotion_dir))
        self.daemons.append(HttpServerNotice(self.kmotion_dir))

    def start(self):
        """
        Check and start all the kmotion daemons

        args    :
        excepts :
        return  : none
        """

        log.info('starting kmotion [{pid}]'.format(pid=self.pid))
        try:
            with open(self.pidfile, 'w') as pf:
                pf.write(str(self.pid))
        except IOError:
            log.warning("Can't write pid to pidfile")

        www_logs.info('kmotion starting up')

        # init the ramdisk dir
        self.init_core.init_ramdisk_dir()

        self.init_core.gen_vhost()

        self.init_core.set_uid_gid_named_pipes(os.getuid(), os.getgid())

        log.debug('starting daemons ...')
#         self.motion_daemon.start_motion()
        self.active = True
        for d in self.daemons:
            d.start()
        log.debug('daemons started...')

    def stop(self):
        """
        stop all the kmotion daemons

        args    :
        excepts :
        return  : none
        """
        self.active = False
        log.debug('stopping kmotion ...')
        for d in self.daemons:
            d.stop()

    def kill_other(self):
        log.debug('killing daemons ...')
        try:
            with open(self.pidfile, 'r') as pf:
                pid = pf.read()
            os.kill(int(pid), signal.SIGTERM)
        except Exception:
            log.warning("Can't read pid from pidfile")
            for pid in self.get_kmotion_pids():
                os.kill(int(pid), signal.SIGTERM)

    def get_kmotion_pids(self):
        try:
            stdout = utils.uni(subprocess.check_output('pgrep -f "^python.+%s.*"' % os.path.basename(__file__), shell=True))
            return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(self.pid)]
        except Exception:
            return []

    def signal_term(self, signum, frame):
        self.stop()

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def wait_termination(self):
        log.debug('waiting daemons ...')
        while self.sleep(1):
            pass
        for d in self.daemons:
            try:
                log.info("wait for {}".format(d.name))
                d.join(1.1 / len(self.daemons))
            except Exception:
                log.exception('wait_termination of {daemon}'.format(daemon=d.name))


if __name__ == '__main__':
    try:
        kmotion_dir = os.path.abspath(os.path.dirname(__file__))
        kmotion = Kmotion(kmotion_dir)
        kmotion.kill_other()
        kmotion.start()
        kmotion.wait_termination()
        www_logs.info('kmotion shutting down')
        log.info("Exit")
    except Exception as e:
        log.error(e)
        www_logs.error(e)
        raise e
