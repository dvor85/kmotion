
import sys

log = None


class sample():

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)
        from core import logger
        global log
        log = logger.Logger('kmotion', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'sample'

    def start(self):
        log.debug('start {0} action feed: {1}'.format(self.key, self.feed))

    def end(self):
        log.debug('end {0} action feed: {1}'.format(self.key, self.feed))
