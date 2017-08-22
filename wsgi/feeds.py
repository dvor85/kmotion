# -*- coding: utf-8 -*-

import os
from core.config import Settings


class Feeds():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env
        self.ramdisk_dir = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')['ramdisk_dir']

    def __call__(self, *args, **kwargs):

        events = os.listdir(os.path.join(self.ramdisk_dir, 'events'))
        events.sort()

        return events
