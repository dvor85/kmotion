'''
@author: demon
'''

import os
import sys
import subprocess
import shlex
import time
import datetime
import signal
import sample

log = None


class rtsp2mp4(sample.sample):

    def __init__(self, kmotion_dir, feed):
        sample.sample.__init__(self, kmotion_dir, feed)

        import core.logger as logger
        global log
        log = logger.Logger('action_rtsp2mp4', logger.Logger.DEBUG)
        self.key = 'rtsp2mp4'

        try:
            from core.mutex_parsers import mutex_kmotion_parser_rd, mutex_www_parser_rd
            parser = mutex_kmotion_parser_rd(kmotion_dir)
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            log.e('init - error {type}: {value} while parsing kmotion_rc file'.format(**{'type': exc_type, 'value': exc_value}))

        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))

        try:
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.sound = www_parser.getboolean('motion_feed%02i' % self.feed, '%s_sound' % self.key)
            self.recode = www_parser.getboolean('motion_feed%02i' % self.feed, '%s_recode' % self.key)
            self.feed_kbs = www_parser.get('motion_feed%02i' % self.feed, 'feed_kbs')
            self.feed_username = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_name')
            self.feed_password = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_pw')

            from core.utils import add_userinfo
            self.feed_grab_url = add_userinfo(
                www_parser.get('motion_feed%02i' % self.feed, '%s_grab_url' % self.key), self.feed_username, self.feed_password)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            log.e('init - error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

    def get_grabber_pids(self):
        try:
            p_obj = subprocess.Popen(
                'pgrep -f "^avconv.+{src}.*"'.format(**{'src': self.feed_grab_url}), stdout=subprocess.PIPE, shell=True)
            stdout = p_obj.communicate()[0]
            return stdout.splitlines()
        except:
            return []

    def get_cmdline(self, pid):
        cmdline_file = os.path.join('/proc', str(pid), 'cmdline')
        if os.path.isfile(cmdline_file):
            with open(cmdline_file, 'r') as f_obj:
                cmdline = f_obj.read()
                return cmdline.replace('\x00', ' ')
        else:
            return ''

    def start_grab(self, src, dst):
        if self.sound:
            audio = "-c:a libfaac -ac 1 -ar 22050 -b:a 64k"
        else:
            audio = "-an"

        if self.recode:
            vcodec = "-c:v libx264 -preset ultrafast -profile:v baseline -b:v %sk -qp 30" % self.feed_kbs
        else:
            vcodec = '-c:v copy'

        grab = 'avconv -threads auto -rtsp_transport tcp -n -i {src} {vcodec} {audio} {dst}'.format(
            **{'src': src, 'dst': dst, 'vcodec': vcodec, 'audio': audio})

        try:
            from subprocess import DEVNULL  # py3k
        except ImportError:
            DEVNULL = open(os.devnull, 'wb')

        ps = subprocess.Popen(shlex.split(grab), stderr=DEVNULL, stdout=DEVNULL, close_fds=True)
        log.d('start grabbing {src} to {dst} with pid={pid}'.format(**{'src': src, 'dst': dst, 'pid': ps.pid}))
        return ps.pid

    def start(self):
        sample.sample.start(self)
        try:
            dt = datetime.datetime.fromtimestamp(time.time())
            event_date = dt.strftime("%Y%m%d")
            event_time = dt.strftime("%H%M%S")
            movie_dir = os.path.join(self.images_dbase_dir, event_date, '%0.2i' % self.feed, 'movie')

            if len(self.get_grabber_pids()) == 0:

                if not os.path.isdir(movie_dir):
                    os.makedirs(movie_dir)

                dst = os.path.join(movie_dir, '%s.mp4' % event_time)

                self.start_grab(self.feed_grab_url, dst)

                if len(self.get_grabber_pids()) == 0 and os.path.isfile(dst):
                    os.unlink(dst)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            log.e('start - error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

    def end(self):
        sample.sample.end(self)
        for pid in self.get_grabber_pids():
            try:
                dst = shlex.split(self.get_cmdline(pid))[-1]
                os.kill(int(pid), signal.SIGTERM)

                if os.path.isfile(dst) and not os.path.getsize(dst) > 0:
                    os.unlink(dst)

                time.sleep(1)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                log.e('end - error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))
