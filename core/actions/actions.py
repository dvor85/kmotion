'''
@author: demon
'''

import sys, os
from threading import Thread


class Actions():
    
    def __init__(self, kmotion_dir, feed):
        sys.path.insert(1, os.path.join(kmotion_dir, 'core'))
        
        import logger, mutex_parsers
        
        self.logger = logger.Logger('actions', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.logger('init', logger.DEBUG)
        self.actions = []
        try:            
            www_parser = mutex_parsers.mutex_www_parser_rd(self.kmotion_dir)
            self.feed_actions = set(www_parser.get('motion_feed%02i' % self.feed, 'feed_actions').split(' ')) 
            
            for feed_action in self.feed_actions:
                action_mod = __import__(feed_action, globals=globals(), fromlist=[feed_action]) 
                action = getattr(action_mod, feed_action)(self.kmotion_dir, self.feed)
                self.actions.append(action)
                            
        except:
            self.logger('error while init', logger.DEBUG)
            
            
        
    def start(self):
        for action in self.actions: 
            Thread(target=action.start).start()
            
        
    def end(self):
        for action in self.actions: 
            Thread(target=action.end).start()
        



        
