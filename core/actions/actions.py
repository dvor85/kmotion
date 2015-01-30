'''
@author: demon
'''

import sys, os
from threading import Thread


class Actions():
    
    def __init__(self, kmotion_dir, feed):
        sys.path.insert(1, os.path.join(kmotion_dir, 'core'))
        
        import logger, mutex_parsers
        
        self.log = logger.Logger('actions', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.log('init', logger.DEBUG)
        self.actions = []
        try:            
            www_parser = mutex_parsers.mutex_www_parser_rd(self.kmotion_dir)
            self.feed_actions = set(www_parser.get('motion_feed%02i' % self.feed, 'feed_actions').split(' ')) 
            
            for feed_action in self.feed_actions:
                action_mod = __import__(feed_action, globals=globals(), fromlist=[feed_action]) 
                action = getattr(action_mod, feed_action)(self.kmotion_dir, self.feed)
                self.actions.append(action)
                            
        except:
            self.log('error while init', logger.DEBUG)
            
            
        
    def start(self):
        t_list = []
        for action in self.actions:
            t = Thread(target=action.start)
            t_list.append(t)
            t.start()
            
        for t in t_list:
            t.join()
            
        
    def end(self):
        t_list = []
        for action in self.actions:
            t = Thread(target=action.end)
            t_list.append(t)
            t.start()
            
        for t in t_list:
            t.join()
        



        
