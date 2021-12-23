#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

"""
Waits on the 'fifo_settings_wr' fifo until data received then parse the data
and modifiy 'www_rc'
"""

import os
from core import logger, utils
import time
import json
import subprocess
import threading
from six import iterkeys, iteritems
from multiprocessing import Process
from camera_lost import CameraLost
from core.mutex_parsers import mutex_www_parser_rd, mutex_www_parser_wr
from core.config import Settings
import signal

log = logger.Logger(__name__, logger.ERROR)


class Kmotion_setd(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.name = 'setd'
        self.daemon = True
        self.active = False
        self.kmotion_dir = kmotion_dir
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        log.setLevel(config_main['log_level'])

    def run(self):
        """
        Waits on the 'fifo_settings_wr' fifo until data received then parse the data
        and modifiy 'www_rc'

        """

        self.active = True
        log.info('starting daemon [{pid}]'.format(pid=self.pid))
        while self.active:
            try:
                log.debug('waiting on FIFO pipe data')
                self.config = {}
                data = ''
                with open('{}/www/fifo_settings_wr'.format(self.kmotion_dir), 'r') as pipein:
                    data = utils.uni(pipein.read())
                if data:
                    log.debug('kmotion FIFO pipe data: %s' % data)

                    self.config = json.loads(data)
                    self.user = self.config["user"]
                    must_reload = self.config.get("force_reload", False)

                    www_rc = 'www_rc_%s' % self.user
                    www_rc_path = os.path.join(self.kmotion_dir, 'www', www_rc)
                    if not os.path.isfile(www_rc_path):
                        raise Exception('Incorrect configuration!')

                    www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
                    for section in iterkeys(self.config):
                        if section == 'feeds':
                            for feed in iterkeys(self.config[section]):
                                feed_section = 'motion_feed%02i' % int(feed)
                                if not www_parser.has_section(feed_section):
                                    www_parser.add_section(feed_section)
                                for k, v in iteritems(self.config[section][feed]):
                                    if k == 'reboot_camera' and utils.parse_str(v) is True and \
                                            os.path.basename(os.path.realpath(www_rc_path)) == 'www_rc':
                                        cam_lost = CameraLost(self.kmotion_dir, feed)
                                        threading.Thread(target=cam_lost.reboot_camera).start()
                                    else:
                                        must_reload = True
                                        val = utils.utf(v)
                                        www_parser.set(feed_section, k, val)
                        elif section == 'display_feeds':
                            misc_section = 'misc'
                            if not www_parser.has_section(misc_section):
                                www_parser.add_section(misc_section)
                            for k, v in iteritems(self.config[section]):
                                if len(v) > 0:
                                    www_parser.set(misc_section, 'display_feeds_%02i' % int(k), ','.join([str(i) for i in v]))
                        elif isinstance(self.config[section], dict):
                            if not www_parser.has_section(section):
                                www_parser.add_section(section)
                            for k, v in iteritems(self.config[section]):
                                val = utils.utf(v)
                                www_parser.set(section, k, val)
                    mutex_www_parser_wr(self.kmotion_dir, www_parser, www_rc)

                    if must_reload and os.path.basename(os.path.realpath(www_rc_path)) == 'www_rc':
                        log.error('Reload kmotion...')
                        subprocess.Popen([os.path.join(self.kmotion_dir, 'kmotion.py')])
            except Exception:  # global exception catch
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def stop(self):
        log.info('stop {name}'.format(name=__name__))
        self.active = False
        if self.pid:
            os.kill(self.pid, signal.SIGKILL)
