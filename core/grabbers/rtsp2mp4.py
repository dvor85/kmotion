'''
@author: demon
'''

import os, subprocess, shlex, time, datetime, cPickle, signal, logger
from mutex_parsers import *
from urlparse import urlsplit


class rtsp2mp4():
    
    log_level = logger.DEBUG
    
    def __init__(self, kmotion_dir, feed):
        self.logger = logger.Logger('rtsp2mp4', rtsp2mp4.log_level)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        
        try:
            parser = mutex_kmotion_parser_rd(kmotion_dir) 
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        except:
            self.logger.log('error while parsing kmotion_rc file') 
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        
        try:
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.feed_sound = www_parser.getboolean('motion_feed%02i' % self.feed, 'feed_sound')
            self.feed_kbs = www_parser.get('motion_feed%02i' % self.feed, 'feed_kbs')
            self.feed_recode = www_parser.getboolean('motion_feed%02i' % self.feed, 'feed_recode')
            self.feed_username = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_name')
            self.feed_password = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_pw')
            
            self.feed_grab_url = self.build_url(www_parser.get('motion_feed%02i' % self.feed, 'feed_grab_url'))
            self.feed_reboot_url = self.build_url(www_parser.get('motion_feed%02i' % self.feed, 'feed_reboot_url'))
        except:
            self.logger.log('error while parsing www_rc file')
            
        
    def build_url(self, src_url):
        url = urlsplit(src_url)            
        params = {'scheme':url.scheme, 'hostname':url.hostname, 'path':url.path}
        if url.query == '': 
            params['query'] = '' 
        else: 
            params['query'] = '?%s' % url.query
        if url.username is None:
            params['username'] = self.feed_username
        else:
            params['username'] = url.username
        if url.password is None:
            params['password'] = self.feed_password
        else:
            params['password'] = url.password
        return "{scheme}://{username}:{password}@{hostname}{path}{query}".format(**params)
    
    def is_grab_started(self):
        try:
            with open(self.event_file, 'rb') as dump:
                pid = cPickle.load(dump)
            trys = 2
            while trys > 0:
                if not os.path.isdir(os.path.join('/proc', str(pid))):
                    return False
                trys -= 1
                time.sleep(0.5)
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
        ps = subprocess.Popen('while true; do sleep 10; done;', shell=True)
        self.logger.log('start grabbing {src} to {dst} with pid={pid}'.format(**{'src':src, 'dst':dst, 'pid':ps.pid}))
        return ps.pid
    
    def start(self):
        try:
            dt = datetime.datetime.fromtimestamp(time.time())
            event_date = dt.strftime("%Y%m%d")
            event_time = dt.strftime("%H%M%S")
            movie_dir = os.path.join(self.images_dbase_dir, event_date, str(self.feed), 'movie')
            
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
            self.logger.log('error while start')
                
    def end(self):
        try:
            with open(self.event_file, 'rb') as dump:
                pid = cPickle.load(dump)
                event_start_time = cPickle.load(dump)
                event_start_date = cPickle.load(dump)
            trys = 2
            while os.path.isdir(os.path.join('/proc', str(pid))) or trys>1:
                self.logger.log('end grabbing feed {feed}'.format(**{'feed':self.feed}))
                if trys > 0:
                    os.kill(pid, signal.SIGTERM)
                else:
                    os.kill(pid, signal.SIGKILL)
                trys -= 1
                time.sleep(0.5)
            
            dt = datetime.datetime.fromtimestamp(time.time())
            event_end_time = dt.strftime("%H%M%S")
            
            movie_dir = os.path.join(self.images_dbase_dir, event_start_date, str(self.feed), 'movie')
            dst = os.path.join(movie_dir, '%s.mp4' % event_start_time) 
            movie_journal = os.path.join(self.images_dbase_dir, event_start_date, str(self.feed), 'movie_journal')
            try:
                if os.path.getsize(dst) > 0:
                    with open(movie_journal, 'r+') as f_obj:
                        f_obj.write('$%s' % event_end_time)
                else:
                    os.unlink(dst)
            except:
                self.logger.log('error: file {dst}'.format(**{'dst':dst}))
    
            os.unlink(self.event_file)
        except:
            self.logger.log('error while end')
        
    
    
