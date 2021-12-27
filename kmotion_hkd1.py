#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

"""
Checks the size of the images directory deleteing the oldest directorys first
when 90% of max_size is reached. Responds to a SIGHUP by re-reading its
configuration. Checks the current kmotion software version every 24 hours.
"""

import time
from core import logger, utils
from core.www_logs import WWWLog
from multiprocessing import Process
import os
from io import open
from core.config import Settings

log = logger.Logger('kmotion', logger.ERROR)


class Kmotion_Hkd1(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'hkd1'
        self.images_dbase_dir = ''  # the 'root' directory of the images dbase
        self.kmotion_dir = kmotion_dir
        self.max_size = 0  # max size permitted for the images dbase
        self.motion_log = os.path.join(self.kmotion_dir, 'www', 'motion_out')
        self.www_logs = WWWLog(self.kmotion_dir)
        self.read_config()

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def read_config(self):
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        log.setLevel(config_main['log_level'])
        self.images_dbase_dir = config_main['images_dbase_dir']
        self.max_size = config_main['images_dbase_limit_gb'] * 2 ** 30

    def truncate_motion_logs(self):
        try:
            with open(self.motion_log, 'r+', encoding="utf-8") as f_obj:
                events = f_obj.read().splitlines()
                if len(events) > 500:  # truncate logs
                    events = events[-500:]
                    f_obj.seek(0)
                    f_obj.write('\n'.join(events))
                    f_obj.truncate()
        except Exception:
            log.exception('truncate motion logs error')

    def run(self):
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes

        args    :
        excepts :
        return  : none
        """
        self.active = True
        log.info('starting daemon [{pid}]'.format(pid=self.pid))
        while self.active:
            try:
                self.read_config()

                while self.sleep(15 * 60):
                    self.truncate_motion_logs()

                    # if > 90% of max_size_gb, delete oldest
                    _size = utils.get_dir_size(self.images_dbase_dir)
                    log.info('size of {} = {}'.format(self.images_dbase_dir, utils.sizeof_fmt(_size)))
                    if _size > self.max_size:
                        log.info('image storage limit reached')

                        dir_ = os.listdir(self.images_dbase_dir)
                        dir_.sort()

                        # if need to delete current recording, shut down kmotion
                        for d in dir_:
                            try:
                                fulld = os.path.join(self.images_dbase_dir, d)
                                if time.strftime('%Y%m%d') == d:
                                    log.error('** CRITICAL ERROR ** crash - delete todays data, \'images_dbase\' is too small')
                                    self.www_logs.add_no_space_event()

                                log.info('try to delete {dir}'.format(dir=fulld))
                                if utils.rmdir(fulld):
                                    self.www_logs.add_deletion_event(d)
                                    break
                            except Exception as e:
                                log.error('deleting of "{dir}" error: {error}'.format(dir=fulld, error=e))

            except Exception as e:  # global exception catch
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info('stop {name}'.format(name=__name__))
        self.active = False
