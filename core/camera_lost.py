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

    def __init__(self, kmotion_dir, feed):
        try:
            self.kmotion_dir = kmotion_dir
            self.feed = int(feed)

            cfg = Settings.get_instance(self.kmotion_dir)
            config = cfg.get('www_rc')
            self.feed_username = config['feeds'][self.feed]['feed_lgn_name']
            self.feed_password = config['feeds'][self.feed]['feed_lgn_pw']
            self.feed_list = sorted([f for f in config['feeds'].keys() if config['feeds'][f].get('feed_enabled', False)])
            self.feed_thread = self.feed_list.index(self.feed) + 1

            urllib.FancyURLopener.prompt_user_passwd = lambda *a, **k: (None, None)
            self.feed_url = add_userinfo(config['feeds'][self.feed]['feed_url'], self.feed_username, self.feed_password)
            self.reboot_url = add_userinfo(config['feeds'][self.feed]['feed_reboot_url'], self.feed_username, self.feed_password)
        except Exception:
            log.exception('init error')

    def main(self):
        self.restart_thread(self.feed_thread)
        if len(self.get_prev_instances()) == 0:
            need_reboot = True
            time.sleep(60)
            for t in range(10):
                try:
                    res = urllib.urlopen(self.feed_url)
                    try:
                        text1 = res.read(1)
                        if res.getcode() == 200 and len(text1) > 0:
                            need_reboot = False
                            break
                    finally:
                        res.close()
                except Exception:
                    log.error('error while getting image from feed {feed}'.format(feed=self.feed))
                finally:
                    time.sleep(60)

            if need_reboot:
                if self.reboot_camera():
                    time.sleep(60)
            self.restart_thread(self.feed_thread)

        else:
            log.error('{file} {feed} already running'.format(file=os.path.basename(__file__), feed=self.feed))

    def reboot_camera(self):
        try:
            res = urllib.urlopen(self.reboot_url)
            try:
                if res.getcode() == 200:
                    log.debug('reboot {0} success'.format(self.feed))
                    return True
                else:
                    log.debug('reboot {0} failed with status code {1}'.format(self.feed, res.getcode()))
            finally:
                res.close()
        except Exception:
            log.error('error while reboot {feed}'.format(feed=self.feed))

    def restart_thread(self, thread):
        try:
            res = urllib.urlopen("http://localhost:8080/{feed_thread}/action/restart".format(feed_thread=thread))
            try:
                if res.getcode() == 200:
                    log.debug('restart feed_thread {feed_thread} success'.format(feed_thread=thread))
                    return True
                else:
                    log.debug('restart feed_thread {feed_thread} failed with status code {code}'.format(
                        feed_thread=thread, code=res.getcode()))
            finally:
                res.close()
        except Exception:
            log.error('error while restart feed_thread {feed_thread}'.format(feed_thread=thread))

    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^python.+%s %i$"' %
                                 (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    CameraLost(kmotion_dir, sys.argv[1]).main()
