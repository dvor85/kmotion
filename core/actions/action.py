# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import sys


class Action():

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)
        from core import logger
        self.log = logger.Logger(__name__, logger.INFO)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'action'

    def start(self):
        self.log.info('start {0} action feed: {1}'.format(self.key, self.feed))

    def end(self):
        self.log.info('end {0} action feed: {1}'.format(self.key, self.feed))