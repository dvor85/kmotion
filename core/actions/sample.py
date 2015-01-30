
import logger

class sample():
    
    def __init__(self, kmotion_dir, feed):
        self.log = logger.Logger('action_sample', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'sample'
        
    def start(self):
        self.log('start {0} action feed: {1}'.format(self.key, self.feed), logger.DEBUG)
        
        
    def end(self):
        self.log('end {0} action feed: {1}'.format(self.key, self.feed), logger.DEBUG)
