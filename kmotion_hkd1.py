#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Checks the size of the images directory deleteing the oldest directorys first
when 90% of max_size is reached. Responds to a SIGHUP by re-reading its
configuration. Checks the current kmotion software version every 24 hours.
"""

import time
from core import logger, utils
from multiprocessing import Process
from core.config import Settings
from pathlib import Path
import shutil

log = logger.getLogger('kmotion', logger.ERROR)
www_logs = logger.getLogger('www_logs', logger.DEBUG)


class Kmotion_Hkd1(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'hkd1'
        self.images_dbase_dir = ''  # the 'root' directory of the images dbase
        self.kmotion_dir = kmotion_dir
        self.max_size = 0  # max size permitted for the images dbase
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
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])
        self.today_dir = self.images_dbase_dir / '.today'
        utils.mkdir(self.today_dir)
        du = shutil.disk_usage(self.images_dbase_dir)

        self.max_size = min(config_main['images_dbase_limit_gb'] * 2 ** 30, du.total)
        log.info(f'Max size of {self.images_dbase_dir} = {utils.sizeof_fmt(self.max_size)}')

    def run(self):
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes

        args    :
        excepts :
        return  : none
        """
        self.active = True
        log.info(f'starting daemon [{self.pid}]')
        while self.active:
            try:
                self.read_config()

                while self.sleep(15 * 60):
                    _size = utils.get_dir_size(self.images_dbase_dir)
                    _cur_day = time.strftime('%Y%m%d')
                    log.info(f'size of {self.images_dbase_dir} = {utils.sizeof_fmt(_size)}')

                    today_list = []
                    if self.today_dir.is_dir():
                        today_list = sorted(f for f in self.today_dir.iterdir() if f.is_dir() and not f.name.startswith('.'))
                        for f in today_list:
                            if not f.name == _cur_day:
                                log.info(f'Move {f.name} from {self.today_dir} to {self.images_dbase_dir}')
                                may_rmdir = True
                                for s in f.rglob('*'):
                                    if s.is_file():
                                        _d = self.images_dbase_dir / s.relative_to(self.today_dir)
                                        utils.mkdir(_d.parent)
                                        if time.time() - s.stat().st_mtime > 10:
                                            s.replace(_d)
                                        else:
                                            may_rmdir = False
                                if may_rmdir:
                                    utils.rmdir(f)

                    if _size > self.max_size:
                        log.warn('image storage limit reached')

                        for fulld in sorted(self.images_dbase_dir.iterdir()) + today_list:
                            try:
                                if fulld.is_dir():
                                    d = fulld.name
                                    if _cur_day == d:
                                        log.error("** CRITICAL ERROR ** crash - delete todays data, 'images_dbase' is too small")
                                        www_logs.error("Deleting todays data, 'images_dbase' is too small")
                                    if not d.startswith('.'):
                                        log.info(f'try to delete {fulld}')
                                        if utils.rmdir(fulld):
                                            log.warn(f'Deleting archive data for {d[:4]}/{d[4:6]}/{d[6:8]}')
                                            www_logs.warn(f'Deleting archive data for {d[:4]}/{d[4:6]}/{d[6:8]}')
                                            break

                            except Exception as e:
                                log.error(f'deleting of "{fulld}" error: {e}')

            except Exception as e:  # global exception catch
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info(f'stop {__name__}')
        self.active = False
