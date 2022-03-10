#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import time
import threading
from core import logger
import events
from camera_lost import CameraLost
from core.config import Settings
import argparse
import requests
import urllib
from six import iterkeys
from pathlib import Path

log = logger.getLogger('kmotion', logger.ERROR)


def create_parser():
    parser = argparse.ArgumentParser(description="Perform some actions for all or specified cameras.",
                                     epilog='(c) 2019 Dmitriy Vorotilin.')
    subparsers = parser.add_subparsers(dest='command', title='Possible commands')

    reboot_parser = subparsers.add_parser('reboot', description='reboot cameras')
    reboot_parser.add_argument('--force', '-f', action='store_true', help='Force reboot unconditionally.')
    query_parser = subparsers.add_parser('query', description='perform http query for cameras')
    query_parser.add_argument('query', help="http's query part")

    parser.add_argument('--debug', '-d', action='store_true')
    parser.add_argument('--cam', '-c', action='append', type=int,
                        help='Cameras for action. If not specified, perform for all cameras.')

    return parser


class RebootCams():

    def __init__(self, kmotion_dir):
        parser = create_parser()
        self.options = parser.parse_args()
        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')
        if self.options.debug:
            log.setLevel(10)
        else:
            log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.events_dir = Path(self.ramdisk_dir, 'events')

        if self.options.cam:
            self.camera_ids = self.options.cam
        else:
            self.camera_ids = sorted([f for f in iterkeys(self.config['feeds']) if self.config['feeds'][f].get('feed_enabled', False)])

    def reboot_cam(self, cam):
        state_file = Path(self.ramdisk_dir, 'states', str(cam))
        while not self.options.force and (str(cam) in os.listdir(self.events_dir) or events.get_state(state_file) == events.STATE_START):
            time.sleep(10)
        cam_lost = CameraLost(self.kmotion_dir, cam)
        cam_lost.reboot_camera()

    def query(self, cam):
        url = self.config['feeds'][cam]['feed_reboot_url']
        _res = urllib.parse.urlsplit(url)
        _result = urllib.parse.urlsplit(self.options.query)
        fquery = _result._replace(scheme=_res.scheme, netloc=_res.netloc).geturl()
        log.debug(f'try perform {fquery}')
        r = requests.get(fquery)
        if r.ok:
            log.info(f'get query for {cam} successful')
        else:
            log.warn(f'get query for {cam} unsuccessful with code {r.status_code}')

    def main(self):
        for cam in self.camera_ids:
            if self.options.command == 'reboot':
                threading.Thread(target=self.reboot_cam, args=(cam,)).start()
            elif self.options.command == 'query':
                threading.Thread(target=self.query, args=(cam,)).start()


if __name__ == '__main__':
    log.info(f'start {Path(__file__).name}')
    kmotion_dir = Path(__file__).absolute().parent
    reboot_cams = RebootCams(kmotion_dir)
    reboot_cams.main()
