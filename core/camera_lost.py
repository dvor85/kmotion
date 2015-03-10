#!/usr/bin/env python
'''
@author: demon
'''

import logger, subprocess, os, sys, time, urllib
from mutex_parsers import *
from urlparse import urlsplit


class CameraLost:
    '''
    classdocs
    '''
    def __init__(self, kmotion_dir, feed):        
        self.log = logger.Logger('camera_lost', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        
        www_parser = mutex_www_parser_rd(self.kmotion_dir)
        self.feed_username = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_name')
        self.feed_password = www_parser.get('motion_feed%02i' % self.feed, 'feed_lgn_pw')
        
        self.reboot_url = CameraLost.add_userinfo(www_parser.get('motion_feed%02i' % self.feed, 'feed_reboot_url'), self.feed_username, self.feed_password)
        self.feed_url = CameraLost.add_userinfo(www_parser.get('motion_feed%02i' % self.feed, 'feed_url'), self.feed_username, self.feed_password)
        urllib.FancyURLopener.prompt_user_passwd = lambda *a, **k: (None, None)
        
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
                
    def main(self):
        if len(self.get_prev_instances()) == 0:            
            need_reboot = True
            self.restart_thread(0)
            time.sleep(60)
            for t in range(600):
                try:
                    res = urllib.urlopen(self.feed_url)
                    try:                
                        if res.getcode() == 200:
                            need_reboot = False 
                            break
                    finally:
                        res.close()
                except:
                    exc_type, exc_value, exc_traceback = sys.exc_info()
                    self.log('error {type}: {value} while getting image from feed {feed}'.format(**{'type':exc_type, 'value': exc_value, 'feed':self.feed}), logger.CRIT)
                finally:
                    time.sleep(10)
                    
            if need_reboot:
                self.reboot_camera() 
                self.restart_thread(0)
            
        else:
            self.log('{file} {feed} already running'.format(**{'file':os.path.basename(__file__), 'feed':self.feed}), logger.CRIT)
    
    def reboot_camera(self):
        try:
            res = urllib.urlopen(self.reboot_url)
            try:                  
                if res.getcode() == 200:
                    self.log('reboot {0} success'.format(self.feed), logger.DEBUG)   
                    time.sleep(60) 
                else:
                    self.log('reboot {0} with status code {1}'.format(self.feed, res.getcode()), logger.DEBUG)
            finally:
                res.close()
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('error {type}: {value} while reboot {feed}'.format(**{'type':exc_type, 'value': exc_value, 'feed':self.feed}), logger.CRIT)
            
    def restart_thread(self, thread):
        try:
            res = urllib.urlopen("http://localhost:8080/{thread}/action/restart".format(**{'thread':thread}))
            try:
                if res.getcode() == 200:
                    self.log('restart thread {thread} success'.format(**{'thread':thread}), logger.DEBUG) 
                else:
                    self.log('restart thread {thread} with status code {code}'.format({'thread':thread, 'code':res.getcode()}), logger.DEBUG)
            finally:
                res.close() 
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('error {type}: {value} while restart thread {thread}'.format(**{'type':exc_type, 'value': exc_value, 'thread':thread}), logger.CRIT)
    
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^python.+%s %i$"' % (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    CameraLost(kmotion_dir, sys.argv[1]).main()
        
