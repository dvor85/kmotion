# -*- coding: utf-8 -*-
from pathlib import Path
from core.config import Settings


class Feeds():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env
        self.ramdisk_dir = Path(Settings.get_instance(self.kmotion_dir).get('kmotion_rc')['ramdisk_dir'])

    def __call__(self, *args, **kwargs):
        return [e.name for e in Path(self.ramdisk_dir, 'events').iterdir()]
