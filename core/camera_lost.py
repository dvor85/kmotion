#!/usr/bin/env python
'''
@author: demon
'''

import logger
import subprocess
import sys
import os
import time
import urllib
from utils import add_userinfo
from config import Settings

log = logger.Logger('kmotion', logger.DEBUG)


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
            self.feed_username = config['feeds'][self.cam_id]['feed_lgn_name']
            self.feed_password = config['feeds'][self.cam_id]['feed_lgn_pw']

            urllib.FancyURLopener.prompt_user_passwd = lambda *a, **k: (None, None)
            self.camera_url = add_userinfo(config['feeds'][self.cam_id]['feed_url'], self.feed_username, self.feed_password)
            self.reboot_url = add_userinfo(config['feeds'][self.cam_id]['feed_reboot_url'], self.feed_username, self.feed_password)
        except Exception:
            log.exception('init error')

    def main(self):
        self.restart_thread(self.cam_id)
        if len(self.get_prev_instances()) == 0:
            need_reboot = True
            time.sleep(60)
            for t in range(10):
                try:
                    res = urllib.urlopen(self.camera_url)
                    try:
                        text1 = res.read(1)
                        if res.getcode() == 200 and len(text1) > 0:
                            need_reboot = False
                            break
                    finally:
                        res.close()
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
            res = urllib.urlopen(self.reboot_url)
            try:
                if res.getcode() == 200:
                    log.debug('reboot {0} success'.format(self.cam_id))
                    return True
                else:
                    log.debug('reboot {0} failed with status code {1}'.format(self.cam_id, res.getcode()))
            finally:
                res.close()
        except Exception:
            log.error('error while reboot {cam_id}'.format(cam_id=self.cam_id))

    def restart_thread(self, cam_id):
        try:
            res = urllib.urlopen("http://localhost:8080/{cam_id}/action/restart".format(cam_id=cam_id))
            try:
                if res.getcode() == 200:
                    log.debug('restart camera {cam_id} success'.format(cam_id=cam_id))
                    return True
                else:
                    log.debug('restart camera {cam_id} failed with status code {code}'.format(
                        cam_id=cam_id, code=res.getcode()))
            finally:
                res.close()
        except Exception:
            log.error('error while restart camera {cam_id}'.format(cam_id=cam_id))

    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^python.+%s %i$"' % 
                                 (os.path.basename(__file__), self.cam_id), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    CameraLost(kmotion_dir, sys.argv[1]).main()
