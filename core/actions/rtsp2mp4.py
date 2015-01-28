'''
@author: demon
'''

import os, subprocess, shlex, time, datetime, cPickle, signal, logger
from mutex_parsers import *
from urlparse import urlsplit
import sample


class rtsp2mp4(sample.sample):
    
    def __init__(self, kmotion_dir, feed):
        sample.sample.__init__(self, kmotion_dir, feed)
        self.logger = logger.Logger('action_rtsp2mp4', logger.DEBUG)
        
        try:
            parser = mutex_kmotion_parser_rd(kmotion_dir) 
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        except:
            self.logger('error while parsing kmotion_rc file', logger.CRIT) 
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        
        try:
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.feed_sound = www_parser.getboolean('motion_feed%02i' % self.feed, 'feed_sound')
            self.feed_kbs = www_parser.get('motion_feed%02i' % self.feed, 'feed_kbs')
            self.feed_recode = www_parser.getboolean('motion_feed%02i' % self.feed, 'feed_recode')
            self.feed_username = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_name')
            self.feed_password = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_pw')
            
            self.feed_grab_url = rtsp2mp4.add_userinfo(www_parser.get('motion_feed%02i' % self.feed, 'feed_grab_url'), self.feed_username, self.feed_password)
            self.feed_reboot_url = rtsp2mp4.add_userinfo(www_parser.get('motion_feed%02i' % self.feed, 'feed_reboot_url'), self.feed_username, self.feed_password)
        except:
            self.logger('error while parsing www_rc file', logger.DEBUG)
            
    @staticmethod    
    def add_userinfo(src_url, username, password):
        url = urlsplit(src_url)            
        params = {'scheme':url.scheme, 'hostname':url.hostname, 'path':url.path}
        if url.query == '': 
            params['query'] = '' 
        else: 
            params['query'] = '?%s' % url.query
        if url.username is None:
            params['username'] = username
        else:
            params['username'] = url.username
        if url.password is None:
            params['password'] = password
        else:
            params['password'] = url.password
        return "{scheme}://{username}:{password}@{hostname}{path}{query}".format(**params)
    
    def is_grab_started(self):
        try:
            with open(self.event_file, 'rb') as dump:
                pid = cPickle.load(dump)
            for i in range(2):
                if not os.path.isdir(os.path.join('/proc', str(pid))):
                    if i == 0:
                        time.sleep(0.5)
                    else:
                        return False
                
        except:
            return False
        return True
        
        
    def start_grab(self, src, dst):
        if self.feed_sound:
            audio = "-c:a libfaac -ac 1 -ar 22050 -b:a 64k" 
        else:
            audio = "-an";
        
        if self.feed_recode:
            vcodec = "-c:v libx264 -preset ultrafast -profile:v baseline -b:v %sk -qp 30" % self.feed_kbs
        else:
            vcodec = '-c:v copy'
            
        grab = 'avconv -rtsp_transport tcp -n -i {src} {vcodec} {audio} {dst}'.format(**{'src':src, 'dst':dst, 'vcodec':vcodec, 'audio':audio})
        
        try:
            from subprocess import DEVNULL  # py3k
        except ImportError:
            DEVNULL = open(os.devnull, 'wb')
        
        # ps = subprocess.Popen(shlex.split(grab), stderr=DEVNULL, stdout=DEVNULL, close_fds=True)
        ps = subprocess.Popen(['sleep', '1000'])
        self.logger('start grabbing {src} to {dst} with pid={pid}'.format(**{'src':src, 'dst':dst, 'pid':ps.pid}), logger.DEBUG)
        return ps.pid
    
    def start(self):
        sample.sample.start(self)
        try:
            dt = datetime.datetime.fromtimestamp(time.time())
            event_date = dt.strftime("%Y%m%d")
            event_time = dt.strftime("%H%M%S")
            movie_dir = os.path.join(self.images_dbase_dir, event_date, '%0.2i' % self.feed, 'movie')
            
            if not self.is_grab_started():
            
                if not os.path.isdir(movie_dir):
                    os.makedirs(movie_dir)   
                    
                dst = os.path.join(movie_dir, '%s.mp4' % event_time)        
        
                pid = self.start_grab(self.feed_grab_url, dst) 
                
                if not pid == '' and os.path.isdir(os.path.join('/proc', str(pid))):
                    with open(self.event_file, 'wb') as dump:
                        cPickle.dump(pid, dump)
                        cPickle.dump(event_time, dump)
                        cPickle.dump(event_date, dump)
                else:
                    os.unlink(dst)
        except:
            self.logger('error while start', logger.CRIT)
                
    def end(self):
        sample.sample.end(self)
        try:
            with open(self.event_file, 'rb') as dump:
                pid = cPickle.load(dump)
                event_start_time = cPickle.load(dump)
                event_start_date = cPickle.load(dump)
            
            for i in range(3):
                if os.path.isdir(os.path.join('/proc', str(pid))):
                    if i == 0:
                        self.logger('terminate grabbing feed {feed}'.format(**{'feed':self.feed}), logger.DEBUG)
                        os.kill(pid, signal.SIGTERM)
                    elif i == 1:
                        self.logger('killing grabbing feed {feed}'.format(**{'feed':self.feed}), logger.DEBUG)
                        os.kill(pid, signal.SIGKILL)
                    else:
                        self.logger('problem by killing pid: {pid}'.format(**{'pid':pid}), logger.DEBUG)
                    time.sleep(0.5)
            
            dt = datetime.datetime.fromtimestamp(time.time())
            event_end_time = dt.strftime("%H%M%S")
            
            movie_dir = os.path.join(self.images_dbase_dir, event_start_date, '%0.2i' % self.feed, 'movie')
            dst = os.path.join(movie_dir, '%s.mp4' % event_start_time) 
            movie_journal = os.path.join(self.images_dbase_dir, event_start_date, '%0.2i' % self.feed, 'movie_journal')
            try:
                if os.path.getsize(dst) > 0:
                    with open(movie_journal, 'r+') as f_obj:
                        f_obj.write('$%s' % event_end_time)
                else:
                    os.unlink(dst)
            except:
                self.logger('error: file {dst}'.format(**{'dst':dst}), logger.CRIT)
    
            os.unlink(self.event_file)
        except:
            self.logger('error while end', logger.DEBUG)
        
    
    
