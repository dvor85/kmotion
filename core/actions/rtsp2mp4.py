'''
@author: demon
'''

import os, sys, subprocess, shlex, time, datetime, shelve, signal, logger
from mutex_parsers import *
from urlparse import urlsplit
from contextlib import closing
import sample


class rtsp2mp4(sample.sample):
    
        
    def __init__(self, kmotion_dir, feed):
        sample.sample.__init__(self, kmotion_dir, feed)
        self.log = logger.Logger('action_rtsp2mp4', logger.DEBUG)
        self.key = 'rtsp2mp4'
        
        try:
            parser = mutex_kmotion_parser_rd(kmotion_dir) 
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('init - error {type}: {value} while parsing kmotion_rc file'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT) 
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        
        try:
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.sound = www_parser.getboolean('motion_feed%02i' % self.feed, '%s_sound' % self.key)
            self.feed_kbs = www_parser.get('motion_feed%02i' % self.feed, 'feed_kbs')
            self.recode = www_parser.getboolean('motion_feed%02i' % self.feed, '%s_recode' % self.key)
            self.feed_username = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_name')
            self.feed_password = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_pw')
            
            self.feed_grab_url = rtsp2mp4.add_userinfo(www_parser.get('motion_feed%02i' % self.feed, '%s_grab_url' % self.key), self.feed_username, self.feed_password)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('init - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT)            
        
            
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
        if url.port is None:
            params['port'] = ''
        else:
            params['port'] = ':%i' % url.port 
        return "{scheme}://{username}:{password}@{hostname}{port}{path}{query}".format(**params)
    
    def is_grab_started(self):
        try:
            with closing(shelve.open(self.event_file), 'r') as db:
                pid = db[self.key]['pid']
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
        if self.sound:
            audio = "-c:a libfaac -ac 1 -ar 22050 -b:a 64k" 
        else:
            audio = "-an";
        
        if self.recode:
            vcodec = "-c:v libx264 -preset ultrafast -profile:v baseline -b:v %sk -qp 30" % self.feed_kbs
        else:
            vcodec = '-c:v copy'
            
        grab = 'avconv -rtsp_transport tcp -n -i {src} {vcodec} {audio} {dst}'.format(**{'src':src, 'dst':dst, 'vcodec':vcodec, 'audio':audio})
        
        try:
            from subprocess import DEVNULL  # py3k
        except ImportError:
            DEVNULL = open(os.devnull, 'wb')
        
        ps = subprocess.Popen(shlex.split(grab), stderr=DEVNULL, stdout=DEVNULL, close_fds=True)
        #ps = subprocess.Popen(['sleep', '1000'])
        self.log('start grabbing {src} to {dst} with pid={pid}'.format(**{'src':src, 'dst':dst, 'pid':ps.pid}), logger.DEBUG)
        return ps.pid
    
    def start(self):
        sample.sample.start(self)
        try:
            dt = datetime.datetime.fromtimestamp(time.time())
            data = {}
            data['event_date'] = dt.strftime("%Y%m%d")
            data['event_time'] = dt.strftime("%H%M%S")
            movie_dir = os.path.join(self.images_dbase_dir, data['event_date'], '%0.2i' % self.feed, 'movie')
            
            if not self.is_grab_started():
            
                if not os.path.isdir(movie_dir):
                    os.makedirs(movie_dir)   
                    
                dst = os.path.join(movie_dir, '%s.mp4' % data['event_time'])        
        
                data['pid'] = self.start_grab(self.feed_grab_url, dst) 
                
                if data['pid'] != '' and os.path.isdir(os.path.join('/proc', str(data['pid']))):
                    try:
                        db = shelve.open(self.event_file)
                    except:
                        os.unlink(self.event_file)
                        db = shelve.open(self.event_file)
                    try:
                        db[self.key] = data
                    finally:
                        db.close()
                        
                else:
                    if os.path.isfile(dst):
                        os.unlink(dst)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('start - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT)
                
    def end(self):
        sample.sample.end(self)
        try:
            with closing(shelve.open(self.event_file)) as db:
                data = db.pop(self.key)
            for i in range(3):
                if os.path.isdir(os.path.join('/proc', str(data['pid']))):
                    if i == 0:
                        self.log('terminate grabbing feed {feed}'.format(**{'feed':self.feed}), logger.DEBUG)
                        os.kill(data['pid'], signal.SIGTERM)
                    elif i == 1:
                        self.log('killing grabbing feed {feed}'.format(**{'feed':self.feed}), logger.DEBUG)
                        os.kill(data['pid'], signal.SIGKILL)
                    else:
                        self.log('problem by killing pid: {pid}'.format(**{'pid':data['pid']}), logger.DEBUG)
                    time.sleep(0.5)
            
            dt = datetime.datetime.fromtimestamp(time.time())
            event_end_time = dt.strftime("%H%M%S")
            
            movie_dir = os.path.join(self.images_dbase_dir, data['event_date'], '%0.2i' % self.feed, 'movie')
            dst = os.path.join(movie_dir, '%s.mp4' % data['event_time']) 
            movie_journal = os.path.join(self.images_dbase_dir, data['event_date'], '%0.2i' % self.feed, 'movie_journal')
            if os.path.isfile(dst):
                if os.path.getsize(dst) > 0:
                    with open(movie_journal, 'a+') as f_obj:
                        f_obj.write('$%s' % event_end_time)
                else:
                    os.unlink(dst)
                
                
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('end - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT)
        
    
    
