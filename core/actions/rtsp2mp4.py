# -*- coding: utf-8 -*-
'''
@author: demon
'''

import os
import subprocess
import shlex
import time
import datetime
import signal
from core.actions import action
import re
from core import utils
from pathlib import Path


class rtsp2mp4(action.Action):

    def __init__(self, kmotion_dir, feed):
        action.Action.__init__(self, kmotion_dir, feed)

        self.key = 'rtsp2mp4'

        from core.config import Settings
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.log.setLevel(min(config_main['log_level'], self.log.getEffectiveLevel()))
        config = cfg.get('www_rc')
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])

        self.event_file = Path(self.ramdisk_dir, 'events', str(self.feed))

        try:
            self.sound = config['feeds'][self.feed].get(f'{self.key}_sound', False)
            self.recode = config['feeds'][self.feed].get(f'{self.key}_recode', False)
            self.feed_kbs = config['feeds'][self.feed].get('feed_kbs', 1024)
            self.feed_username = config['feeds'][self.feed]['feed_lgn_name']
            self.feed_password = config['feeds'][self.feed]['feed_lgn_pw']
            self.feed_url = config['feeds'][self.feed]['feed_url']
            self.feed_name = config['feeds'][self.feed].get('feed_name', f"Get from camera {self.feed}")

            self.feed_grab_url = utils.url_add_auth(config['feeds'][self.feed].get(f'{self.key}_url', self.feed_url),
                                                    (self.feed_username, self.feed_password))
        except Exception:
            self.log.exception('init error')

    def get_grabber_pids(self):
        try:
            return utils.uni(subprocess.check_output(['pgrep', '-f', f"^ffmpeg.+{self.feed_grab_url}.*"], shell=False)).splitlines()
        except Exception:
            return []

    def get_cmdline(self, pid):
        cmdline_file = Path('/proc', str(pid), 'cmdline')
        if cmdline_file.is_file():
            return cmdline_file.read_text().replace('\x00', ' ')
        else:
            return ''

    def get_codec(self, codec):
        try:
            enc_regex = re.compile(f"\s*[AV.]{{6}}\s+(?P<codec>.*?{codec}.*?)\s+.*")
            encoders = utils.uni(subprocess.check_output(["ffmpeg", "-loglevel", "error", "-encoders"])).splitlines()
            for enc in encoders:
                enc_match = enc_regex.match(enc)
                if enc_match:
                    self.log.debug('Found codec: {enc}'.format(enc=enc_match.group("codec")))
                    return enc_match.group("codec")
        except Exception:
            self.log.exception(f"Can't get codec: {codec}")

    def start_grab(self, src, dst, dtime=datetime.datetime.now()):
        audio = "-an"
        if self.sound:
            codec = self.get_codec("aac")
            if codec:
                audio = f"-c:a {codec} -ac 1 -ar 22050 -b:a 64k"

        metadata = f'-metadata creation_time="{dtime:%Y-%m-%d %H:%M:%S}" -metadata title="{self.feed_name}"'

        if self.recode:
            vcodec = f"-c:v libx264 -preset ultrafast -profile:v baseline -b:v {self.feed_kbs}k -qp 30"
        else:
            vcodec = '-c:v copy'

        grab = f"ffmpeg -loglevel error -threads auto -rtsp_transport tcp -n -i {src} {vcodec} {audio} {metadata} {dst}"

        self.log.debug(f"try start grabbing {src} to {dst}")
        ps = subprocess.Popen(shlex.split(grab))

        return ps.pid

    def start(self):
        action.Action.start(self)
        try:
            dtime = datetime.datetime.now()
            movie_dir = Path(self.images_dbase_dir, dtime.strftime("%Y%m%d"), f'{self.feed:02d}', 'movie')

            if len(self.get_grabber_pids()) == 0:
                movie_dir.mkdir(parents=True, exist_ok=True)
                dst = Path(movie_dir, f'{self.feed}_{dtime:%Y%m%d_%H%M%S}.mp4')
                self.start_grab(self.feed_grab_url, dst, dtime)

                if len(self.get_grabber_pids()) == 0 and dst.is_file():
                    dst.unlink()
        except Exception:
            self.log.exception('start error')

    def end(self):
        action.Action.end(self)
        for pid in self.get_grabber_pids():
            try:
                dst = Path(shlex.split(self.get_cmdline(pid))[-1])
                os.kill(int(pid), signal.SIGTERM)

                if dst.is_file() and not dst.stat().st_size > 0:
                    dst.unlink()

                time.sleep(1)
            except Exception:
                self.log.exception('end error')
