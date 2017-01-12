
import sys

log = None


class sample():

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)
        import core.logger as logger
        global log
        log = logger.Logger('action_sample', logger.Logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'sample'

    def start(self):
        log.d('start {0} action feed: {1}'.format(self.key, self.feed))

    def end(self):
        log.d('end {0} action feed: {1}'.format(self.key, self.feed))
