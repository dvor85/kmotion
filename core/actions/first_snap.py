# -*- coding: utf-8 -*-

import time
import shutil
import datetime
from core.actions import action
from core import utils
from pathlib import Path


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
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])
        self.today_dir = self.images_dbase_dir / '.today'

    def start(self):
        action.Action.start(self)
        dtime = datetime.datetime.now()

        src = Path(self.ramdisk_dir, f"{self.feed:02d}", f'{dtime:%Y%m%d%H%M%S}.jpg')
        dst = Path(self.today_dir, dtime.strftime('%Y%m%d'), f'{self.feed:02}', 'snap', f'{self.feed}_{dtime:%Y%m%d_%H%M%S}.jpg')

        if src.is_file():
            try:
                self.log.debug(f'copy {src} to {dst}')
                utils.mkdir(dst.parent)
                time.sleep(1)
                shutil.copy(src, dst)
            except Exception:
                self.log.exception('error while copy jpg to snap dir.')

    def end(self):
        # action.Action.end(self)
        pass
