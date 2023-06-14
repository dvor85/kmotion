#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from core import logger, utils
from core.config import Settings
import argparse
from pathlib import Path

log = logger.getLogger('kmotion', logger.ERROR)


def create_parser():
    parser = argparse.ArgumentParser(description="Generate m3u playlist with cameras's streams",
                                     epilog='(c) 2023 Dmitriy Vorotilin.')

    parser.add_argument('--debug', '-d', action='store_true')
    parser.add_argument('out_m3u_path', help='Output m3u path')

    return parser


class GenerateM3U():

    def __init__(self, kmotion_dir):
        parser = create_parser()
        self.options = parser.parse_args()
        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.out_m3u = Path(self.options.out_m3u_path, f"{config_main['title']}.m3u")
        self.config = cfg.get('www_rc')
        if self.options.debug:
            log.setLevel(10)
        else:
            log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

        self.camera_ids = sorted([f for f in self.config['feeds'] if self.config['feeds'][f].get('feed_enabled')])

    def main(self):
        with self.out_m3u.open(mode='w') as fp:
            fp.write('#EXTM3U\n')
            for cam in self.camera_ids:
                fp.write(f"#EXTINF:-1, {self.config['feeds'][cam]['feed_name']}\n")
                feed_grab_url = utils.url_add_auth(self.config['feeds'][cam].get(f'rtsp2mp4_url', self.config['feeds'][cam]['feed_url']),
                                    (self.config['feeds'][cam]['feed_lgn_name'], self.config['feeds'][cam]['feed_lgn_pw']))
                fp.write(f"{feed_grab_url}\n")


if __name__ == '__main__':
    log.info(f'start {Path(__file__).name}')
    kmotion_dir = Path(__file__).absolute().parent
    GenerateM3U(kmotion_dir).main()
