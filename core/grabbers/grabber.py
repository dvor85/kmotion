'''
@author: demon
'''
import os, logger
from mutex_parsers import *

class Grabber():
    log_level = logger.WARNING
    
    def __init__(self, kmotion_dir, feed):
        self.logger = logger.Logger('grabber', Grabber.log_level)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.logger.log('init')
        try:            
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.feed_grabber = www_parser.get('motion_feed%02i' % self.feed, 'feed_grabber') 
            grabber_mod = __import__(self.feed_grabber, globals=globals(), fromlist=[])  
                    
            self.grabber = getattr(grabber_mod, self.feed_grabber)(self.kmotion_dir, self.feed)
           
        except:
            self.logger.log('error while init')
        
    def start(self):
        self.grabber.start()
        
    def end(self):
        self.grabber.end()
        



        
