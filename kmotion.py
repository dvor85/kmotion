#!/usr/bin/env python


"""
Called by the kmotion exe file this module re-initialises the kmotion core then
reloads the kmotion daemon configs

The kmotion exe file cannot call this code directly because it may be in a
different working directory
"""

import sys
import os
import signal
import time
import core.logger as logger
import subprocess
from core.mutex_parsers import *
from core.www_logs import WWWLog
from core.motion_daemon import MotionDaemon
from core.init_core import InitCore
from core.kmotion_hkd1 import Kmotion_Hkd1
from core.kmotion_hkd2 import Kmotion_Hkd2
from core.kmotion_setd import Kmotion_setd
from core.kmotion_split import Kmotion_split


log = logger.Logger('main', logger.Logger.DEBUG)


class exit_(Exception):
    pass


class Kmotion:

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.active = False

        signal.signal(signal.SIGTERM, self.signal_term)
        self.www_log = WWWLog(self.kmotion_dir)

        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')

        self.init_core = InitCore(self.kmotion_dir)
#         self.motion_daemon = MotionDaemon(self.kmotion_dir)

        self.daemons = []
        self.daemons.append(MotionDaemon(self.kmotion_dir))
        self.daemons.append(Kmotion_Hkd1(self.kmotion_dir))
        self.daemons.append(Kmotion_Hkd2(self.kmotion_dir))
        self.daemons.append(Kmotion_setd(self.kmotion_dir))
        self.daemons.append(Kmotion_split(self.kmotion_dir))

    def start(self):
        """
        Check and start all the kmotion daemons

        args    :
        excepts :
        return  : none
        """

        log('starting kmotion ...')
        self.www_log.add_startup_event()

        # init the ramdisk dir
        self.init_core.init_ramdisk_dir()

        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.init_core.gen_vhost()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])

        self.init_core.set_uid_gid_named_pipes(os.getuid(), os.getgid())

        log.d('starting daemons ...')
#         self.motion_daemon.start_motion()
        self.active = True
        for d in self.daemons:
            d.start()
        log.d('daemons started...')

    def stop(self):
        """
        stop all the kmotion daemons

        args    :
        excepts :
        return  : none
        """
        self.active = False
        log.d('stopping kmotion ...')
        for d in self.daemons:
            d.stop()

    def kill_other(self):
        log.d('killing daemons ...')
        for pid in self.get_kmotion_pids():
            os.kill(int(pid), signal.SIGTERM)
        time.sleep(2)

    def get_kmotion_pids(self):
        p_objs = subprocess.Popen('pgrep -f "^python.+%s.*"' % os.path.basename(__file__), shell=True, stdout=subprocess.PIPE)
        stdout = p_objs.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]

    def signal_term(self, signum, frame):
        self.stop()

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)

    def wait_termination(self):
        log.d('waiting daemons ...')
        while self.active:
            self.sleep(1)
#         for d in self.daemons:
#             try:
#                 d.join()
#             except:
#                 exc_type, exc_value, exc_traceback = sys.exc_info()
#                 log.e('wait_termination of {daemon} - error {type}: {value}'.format(
#                     daemon=d.name, type=exc_type, value=exc_value))


if __name__ == '__main__':
    log.d("PID={pid}".format(pid=os.getpid()))
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
#     option = ''
#     if len(sys.argv) > 1:
#         option = sys.argv[1]
    kmotion = Kmotion(kmotion_dir)
    kmotion.kill_other()
    kmotion.start()
    kmotion.wait_termination()
    kmotion.www_log.add_shutdown_event()
