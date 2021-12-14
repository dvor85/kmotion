#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

"""
Copys, moves or deletes files
"""

import time
import shutil
import datetime
from core import logger
from multiprocessing import Process
import os
from io import open
from six import iterkeys
from core.config import Settings

log = logger.Logger('kmotion', logger.WARN)


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
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']
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

        jpg_dir = '%s/%02i' % (self.ramdisk_dir, self.feed)
        jpg_list = os.listdir(jpg_dir)
        jpg_list.sort()

        self.update_title()

        # need this > 10 buffer to ensure kmotion can view jpegs before we
        # move or delete them
        while (len(jpg_list) >= 10):
            jpg = jpg_list.pop(0)
            dtime = datetime.datetime.fromtimestamp(os.path.getmtime(os.path.join(jpg_dir, jpg)))

            if jpg != 'last.jpg':
                p = {'src': os.path.join(jpg_dir, jpg),
                     'dst': os.path.join(self.images_dbase_dir,
                                         dtime.strftime('%Y%m%d'),
                                         '%02i' % self.feed,
                                         'snap',
                                         '{cam}_{dtime}.jpg'.format(cam=self.feed,
                                                                    dtime=dtime.strftime('%Y%m%d_%H%M%S')))}

                if os.path.isfile(p['src']) and self.feed_snap_enabled and self.snap_time <= dtime:
                    try:
                        log.debug('service_snap() - copy {src} to {dst}'.format(**p))
                        if not os.path.isdir(os.path.dirname(p['dst'])):
                            os.makedirs(os.path.dirname(p['dst']))
                        shutil.copy(**p)
                    except Exception:
                        log.exception('service_snap() - error while copy jpg to snap dir.')
                    finally:
                        self.inc_snap_time(self.feed_snap_interval)

                log.debug('service_snap() - delete {src}'.format(**p))
                os.remove(os.path.join(jpg_dir, jpg))

                feed_www_jpg = os.path.join(jpg_dir, 'www', jpg)
                if os.path.lexists(feed_www_jpg):
                    os.remove(feed_www_jpg)

    def update_title(self):
        # updates 'name' with name string
        try:
            title = '%s/%s/%02i/title' % (self.images_dbase_dir, time.strftime('%Y%m%d'), self.feed)
            if not os.path.isdir(os.path.dirname(title)):
                os.makedirs(os.path.dirname(title))

            if not os.path.isfile(title):
                with open(title, 'w', encoding="utf-8") as f_obj:
                    f_obj.write(self.feed_name)
        except Exception:
            log.error('** CRITICAL ERROR **')
            log.exception('update_title()')

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
        self.ramdisk_dir = config_main['ramdisk_dir']
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
        while self.active:
            try:
                log.info('starting daemon ...')
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
                log.exception('** CRITICAL ERROR **')
                self.sleep(60)

    def stop(self):
        log.debug('stop {name}'.format(name=__name__))
        self.active = False
