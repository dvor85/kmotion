#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
'''
@author: demon
'''

import subprocess
import sys
import os
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
                    log.error('error while getting image from camera {cam_id}'.format(cam_id=self.cam_id))
                finally:
                    time.sleep(60)

            if need_reboot:
                if self.reboot_camera():
                    time.sleep(60)
            self.restart_thread(self.cam_id)

        else:
            log.error('{file} {cam_id} already running'.format(file=os.path.basename(__file__), cam_id=self.cam_id))

    def reboot_camera(self):
        try:
            res = requests.get(self.reboot_url, auth=(self.feed_username, self.feed_password))
            res.raise_for_status()
            log.info('reboot {0} success'.format(self.cam_id))
            return True
        except Exception:
            log.debug('reboot {0} failed with status code {1}'.format(self.cam_id, res.getcode()))

    def restart_thread(self, cam_id):
        try:
            res = requests.get(f"http://localhost:{self.motion_webcontrol_port}/{cam_id}/action/restart")
            res.raise_for_status()
            log.debug('restart camera {cam_id} success'.format(cam_id=cam_id))
            return True
        except Exception:
            log.debug('restart camera {cam_id} failed with status code {code}'.format(cam_id=cam_id, code=res.getcode()))

    def get_prev_instances(self):
        try:
            stdout = utils.uni(subprocess.check_output('pgrep -f "^python.+%s %i$"' % (os.path.basename(__file__), self.cam_id), shell=True))
            return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
        except Exception:
            return []


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    CameraLost(kmotion_dir, sys.argv[1]).main()
