#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Copys, moves or deletes files
"""

import time
import shutil
import datetime
from core import logger
from multiprocessing import Process
import os
from pathlib import Path
from six import iterkeys
from core.config import Settings

log = logger.getLogger('kmotion', logger.ERROR)


class Hkd2_Feed():

    def __init__(self, kmotion_dir, feed):
        self.kmotion_dir = kmotion_dir  # the 'root' directory of kmotion
        self.feed = int(feed)  # the feed number
        self.ramdisk_dir = ''  # the 'root' dir of the ramdisk
        self.images_dbase_dir = ''  # the 'root' dir of the images dbase
        self.feed_snap_enabled = False  # feed snap enabled
        self.feed_snap_interval = 0  # snap interval in seconds
        self.feed_fps = 1  # frame fps
        self.feed_name = ''  # feed name
        self.snap_time = datetime.datetime.now()
        self.read_config()

    def read_config(self):
        """
        Read configs from kmotion_rc, kmotion_rc and www_rc.

        args    :
        excepts :
        return  : none
        """

        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        config = cfg.get('www_rc')
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])
        # sys.exit()

        self.feed_snap_interval = config['feeds'][self.feed].get('feed_snap_interval', 0)
        self.feed_snap_enabled = self.feed_snap_interval > 0
        self.feed_fps = config['feeds'][self.feed].get('feed_fps', 1)
        self.feed_name = config['feeds'][self.feed].get('feed_name', '')
        self.inc_snap_time(self.feed_snap_interval)

    def main(self):
        """
        Copys, moves or deletes files from 'ramdisk_dir/kmotion' to
        'images_dbase_dir/snap' generating a 'sanitized' snap sequence.

        args    :
        excepts :
        return  : none
        """

        jpg_dir = Path(self.ramdisk_dir, f'{self.feed:02}')
        jpg_list = os.listdir(jpg_dir)
        jpg_list.sort()

        self.update_title()

        # need this > 10 buffer to ensure kmotion can view jpegs before we
        # move or delete them
        while (len(jpg_list) >= 10):
            jpg = jpg_list.pop(0)
            if jpg != 'last.jpg':
                src = Path(jpg_dir, jpg)
                dtime = datetime.datetime.fromtimestamp(src.stat().st_mtime)
                dst = Path(self.images_dbase_dir, f'{dtime:%Y%m%d}', f'{self.feed:02}', 'snap', f'{self.feed}_{dtime:%Y%m%d_%H%M%S}.jpg')

                if src.is_file() and self.feed_snap_enabled and self.snap_time <= dtime:
                    try:
                        log.debug(f'service_snap() - copy {src} to {dst}')
                        dst.mkdir(parents=True, exist_ok=True)
                        shutil.copy(src, dst)
                    except Exception:
                        log.exception('service_snap() - error while copy jpg to snap dir.')
                    finally:
                        self.inc_snap_time(self.feed_snap_interval)

                log.debug(f'service_snap() - delete {src}')
                src.unlink()

                feed_www_jpg = Path(jpg_dir, 'www', jpg)
                if feed_www_jpg.exists() or feed_www_jpg.is_symlink():
                    feed_www_jpg.unlink()

    def update_title(self):
        # updates 'name' with name string
        try:
            title = Path(self.images_dbase_dir, time.strftime('%Y%m%d'), f'{self.feed:02}', 'title')
            title.parent.mkdir(parents=True, exist_ok=True)
            title.write_text(self.feed_name)
        except Exception:
            log.critical('** CRITICAL ERROR **', exc_info=1)

    def inc_snap_time(self, inc_sec):
        self.snap_time += datetime.timedelta(seconds=inc_sec)


class Kmotion_Hkd2(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.name = 'hkd2'
        self.active = False
        self.daemon = True
        self.kmotion_dir = kmotion_dir

        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        config = cfg.get('www_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.camera_ids = sorted([f for f in iterkeys(config['feeds']) if config['feeds'][f].get('feed_enabled', False)])

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def run(self):
        """
        Start the hkd2 daemon. This daemon wakes up every 2 seconds

        args    :
        excepts :
        return  : none
        """
        self.active = True
        log.info(f'starting daemon [{self.pid}]')
        while self.active:
            try:
                self.instance_list = []  # list of Hkd2_Feed instances
                for feed in self.camera_ids:
                    self.instance_list.append(Hkd2_Feed(self.kmotion_dir, feed))
                while self.sleep(2):
                    for inst in self.instance_list:
                        try:
                            inst.main()
                        except Exception as e:
                            log.error(e)
            except Exception:
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info(f'stop {__name__}')
        self.active = False
