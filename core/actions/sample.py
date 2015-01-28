
import logger

class sample():
    
    def __init__(self, kmotion_dir, feed):
        self.logger = logger.Logger('action_sample', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        
    def start(self):
        self.logger('start action feed: {0}'.format(self.feed), logger.DEBUG)
        
        
    def end(self):
        self.logger('end action feed: {0}'.format(self.feed), logger.DEBUG)
