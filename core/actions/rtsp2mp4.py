# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

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
from io import open


class rtsp2mp4(action.Action):

    def __init__(self, kmotion_dir, feed):
        action.Action.__init__(self, kmotion_dir, feed)

        self.key = 'rtsp2mp4'

        from core.config import Settings
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.log.setLevel(min(config_main['log_level'], self.log.getEffectiveLevel()))
        config = cfg.get('www_rc')
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']

        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))

        try:
            self.sound = config['feeds'][self.feed].get('%s_sound' % self.key, False)
            self.recode = config['feeds'][self.feed].get('%s_recode' % self.key, False)
            self.feed_kbs = config['feeds'][self.feed].get('feed_kbs', 1024)
            self.feed_username = config['feeds'][self.feed]['feed_lgn_name']
            self.feed_password = config['feeds'][self.feed]['feed_lgn_pw']
            self.feed_url = config['feeds'][self.feed]['feed_url']
            self.feed_name = config['feeds'][self.feed].get('feed_name', "Get from camera {0}".format(self.feed))

            self.feed_grab_url = utils.url_add_auth(config['feeds'][self.feed].get('%s_url' % self.key, self.feed_url),
                                                    (self.feed_username, self.feed_password))
        except Exception:
            self.log.exception('init error')

    def get_grabber_pids(self):
        try:
            return utils.uni(subprocess.check_output('pgrep -f "^ffmpeg.+{src}.*"'.format(src=self.feed_grab_url), shell=True)).splitlines()
        except Exception:
            return []

    def get_cmdline(self, pid):
        cmdline_file = os.path.join('/proc', str(pid), 'cmdline')
        if os.path.isfile(cmdline_file):
            with open(cmdline_file, 'r', encoding="utf-8") as f_obj:
                cmdline = f_obj.read()
                return cmdline.replace('\x00', ' ')
        else:
            return ''

    def get_codec(self, codec):
        try:
            enc_regex = re.compile("\s*[AV.]{{6}}\s+(?P<codec>.*?{codec}.*?)\s+.*".format(codec=codec))
            encoders = utils.uni(subprocess.check_output("ffmpeg -loglevel error -encoders", shell=True)).splitlines()
            for enc in encoders:
                enc_match = enc_regex.match(enc)
                if enc_match:
                    self.log.debug('Found codec: {enc}'.format(enc=enc_match.group("codec")))
                    return enc_match.group("codec")
        except Exception:
            self.log.exception("Can't get codec: {codec}".format(codec=codec))

    def start_grab(self, src, dst, dtime=datetime.datetime.now()):
        audio = "-an"
        if self.sound:
            codec = self.get_codec("aac")
            if codec:
                audio = "-c:a {codec} -ac 1 -ar 22050 -b:a 64k".format(codec=codec)

        metadata = '-metadata creation_time="{dtime}" -metadata title="{title}"'.format(
            dtime=dtime.strftime("%Y-%m-%d %H:%M:%S"), title=self.feed_name)

        if self.recode:
            vcodec = "-c:v libx264 -preset ultrafast -profile:v baseline -b:v {feed_kbs}k -qp 30".format(feed_kbs=self.feed_kbs)
        else:
            vcodec = '-c:v copy'

        grab = 'ffmpeg -loglevel error -threads auto -rtsp_transport tcp -n -i {src} {vcodec} {audio} {metadata} {dst}'.format(
            src=src, dst=dst, vcodec=vcodec, audio=audio, metadata=metadata)

        try:
            from subprocess import DEVNULL  # py3k
        except ImportError:
            DEVNULL = open(os.devnull, 'wb')

        self.log.debug('try start grabbing {src} to {dst}'.format(src=src, dst=dst))
        ps = subprocess.Popen(shlex.split(utils.str2(grab)), stderr=DEVNULL, stdout=DEVNULL, close_fds=True)

        return ps.pid

    def start(self):
        action.Action.start(self)
        try:
            dtime = datetime.datetime.now()
            movie_dir = os.path.join(self.images_dbase_dir, dtime.strftime("%Y%m%d"), '%0.2i' % self.feed, 'movie')

            if len(self.get_grabber_pids()) == 0:

                if not os.path.isdir(movie_dir):
                    os.makedirs(movie_dir)

                dst = os.path.join(movie_dir, '{cam}_{dtime}.mp4'.format(cam=self.feed, dtime=dtime.strftime("%Y%m%d_%H%M%S")))

                self.start_grab(self.feed_grab_url, dst, dtime)

                if len(self.get_grabber_pids()) == 0 and os.path.isfile(dst):
                    os.unlink(dst)
        except Exception:
            self.log.exception('start error')

    def end(self):
        action.Action.end(self)
        for pid in self.get_grabber_pids():
            try:
                dst = shlex.split(utils.str2(self.get_cmdline(pid)))[-1]
                os.kill(int(pid), signal.SIGTERM)

                if os.path.isfile(dst) and not os.path.getsize(dst) > 0:
                    os.unlink(dst)

                time.sleep(1)
            except Exception:
                self.log.exception('end error')
