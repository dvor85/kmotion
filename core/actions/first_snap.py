# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators


import os
import time
import shutil
import datetime
from core import utils
from core.actions import action


class first_snap(action.Action):

    def __init__(self, kmotion_dir, feed):
        action.Action.__init__(self, kmotion_dir, feed)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'first_snap'
        from core.config import Settings
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.log.setLevel(min(config_main['log_level'], self.log.getEffectiveLevel()))
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']

    def start(self):
        action.Action.start(self)
        dtime = datetime.datetime.now()
        jpg = '%s.jpg' % dtime.strftime('%Y%m%d%H%M%S')
        jpg_dir = '%s/%02i' % (self.ramdisk_dir, self.feed)

        p = {'src': os.path.join(jpg_dir, jpg),
             'dst': os.path.join(self.images_dbase_dir,
                                 dtime.strftime('%Y%m%d'),
                                 '%02i' % self.feed,
                                 'snap',
                                 '{cam}_{dtime}.jpg'.format(cam=self.feed,
                                                            dtime=dtime.strftime('%Y%m%d_%H%M%S')))}

        if os.path.isfile(p['src']):
            try:
                self.log.debug('copy {src} to {dst}'.format(**p))
                if not os.path.isdir(os.path.dirname(p['dst'])):
                    utils.makedirs(os.path.dirname(p['dst']))
                time.sleep(1)
                shutil.copy(**p)
            except Exception:
                self.log.exception('error while copy jpg to snap dir.')

    def end(self):
        # action.Action.end(self)
        pass
