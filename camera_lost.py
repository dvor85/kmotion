#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
@author: demon
'''

import subprocess
import sys
import os
from pathlib import Path
import time
import requests
from core import utils, logger
from core.config import Settings

log = logger.getLogger('kmotion', logger.ERROR)


class CameraLost:
    '''
    classdocs
    '''

    def __init__(self, kmotion_dir, cam_id):
        try:
            self.kmotion_dir = kmotion_dir
            self.cam_id = int(cam_id)
            self.name = Path(__file__).name

            cfg = Settings.get_instance(self.kmotion_dir)
            config = cfg.get('www_rc')
            config_main = cfg.get('kmotion_rc')
            log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
            self.feed_username = config['feeds'][self.cam_id]['feed_lgn_name']
            self.feed_password = config['feeds'][self.cam_id]['feed_lgn_pw']

            self.camera_url = config['feeds'][self.cam_id]['feed_url']
            self.reboot_url = config['feeds'][self.cam_id]['feed_reboot_url']
            self.motion_webcontrol_port = config_main.get('motion_webcontrol_port', 8080)
        except Exception:
            log.exception('init error')

    def main(self):
        self.restart_thread(self.cam_id)
        if len(self.get_prev_instances()) == 0:
            need_reboot = True
            time.sleep(60)
            for t in range(10):
                try:
                    res = requests.get(self.camera_url, auth=(self.feed_username, self.feed_password))
                    res.raise_for_status()
                except Exception:
                    log.error(f'error while getting image from camera {self.cam_id}')
                finally:
                    time.sleep(60)

            if need_reboot:
                if self.reboot_camera():
                    time.sleep(60)
            self.restart_thread(self.cam_id)

        else:
            log.error(f'{self.name} {self.cam_id} already running')

    def reboot_camera(self):
        try:
            res = requests.get(self.reboot_url)
            res.raise_for_status()
            log.info(f'reboot {self.cam_id} success')
            return True
        except Exception:
            log.debug(f'reboot {self.cam_id} failed with status code {res.getcode()}')

    def restart_thread(self, cam_id):
        try:
            res = requests.get(f"http://localhost:{self.motion_webcontrol_port}/{cam_id}/action/restart")
            res.raise_for_status()
            log.debug(f'restart camera {cam_id} success')
            return True
        except Exception:
            log.debug(f'restart camera {cam_id} failed with status code {res.getcode()}')

    def get_prev_instances(self):
        try:
            stdout = utils.uni(subprocess.check_output(['pgrep', '-f', f"^python.+{self.name} {self.cam_id}$"], shell=False))
            return [pid for pid in stdout.splitlines() if Path('/proc', pid).is_dir() and int(pid) != os.getpid()]
        except Exception:
            return []


if __name__ == '__main__':
    kmotion_dir = Path(__file__).absolute().parent
    CameraLost(kmotion_dir, sys.argv[1]).main()
