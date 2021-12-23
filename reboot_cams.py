#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import time
import threading
from core import logger
import events
from camera_lost import CameraLost
from core.config import Settings
import argparse
from six import iterkeys

log = logger.Logger(__name__, logger.ERROR)


def create_parser():
    parser = argparse.ArgumentParser(description="Reboot all or specified cameras.",
                                     epilog='(c) 2019 Dmitriy Vorotilin.')
    parser.add_argument('--cam', '-c', action='append', type=int,
                        help='Cameras to reboot. If not specified, reboot all cameras. Reboot, when are not grabbing.')
    parser.add_argument('--force', '-f', action='store_true', help='Force reboot unconditionally.')
    return parser


class RebootCams():

    def __init__(self, kmotion_dir):
        parser = create_parser()
        options = parser.parse_args()
        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        config = cfg.get('www_rc')
        log.setLevel(config_main['log_level'])
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.events_dir = os.path.join(self.ramdisk_dir, 'events')

        if options.cam:
            self.camera_ids = options.cam
        else:
            self.camera_ids = sorted([f for f in iterkeys(config['feeds']) if config['feeds'][f].get('feed_enabled', False)])
        self.force_reboot = options.force

    def reboot_cam(self, cam):
        state_file = os.path.join(self.ramdisk_dir, 'states', str(cam))
        while not self.force_reboot and (str(cam) in os.listdir(self.events_dir) or
                                         events.get_state(state_file) == events.STATE_START):
            time.sleep(10)
        cam_lost = CameraLost(self.kmotion_dir, cam)
        cam_lost.reboot_camera()

    def main(self):
        for cam in self.camera_ids:
            threading.Thread(target=self.reboot_cam, args=(cam,)).start()


if __name__ == '__main__':
    log.debug('start reboot_cams')
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    reboot_cams = RebootCams(kmotion_dir)
    reboot_cams.main()
