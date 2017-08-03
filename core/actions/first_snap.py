
import sys
import os
import time
import shutil
from datetime import datetime
import sample

log = None


class first_snap(sample.sample):

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)
        from core import logger
        global log
        log = logger.Logger('kmotion', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'first_snap'
        from core.config import Settings
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']

    def start(self):
        sample.sample.start(self)
        jpg_time = time.time()
        jpg = '%s.jpg' % datetime.fromtimestamp(jpg_time).strftime('%Y%m%d%H%M%S')
        jpg_dir = '%s/%02i' % (self.ramdisk_dir, self.feed)

        p = {'src': os.path.join(jpg_dir, jpg),
             'dst': os.path.join(self.images_dbase_dir,
                                 datetime.fromtimestamp(jpg_time).strftime('%Y%m%d'),
                                 '%02i' % self.feed,
                                 'snap',
                                 '%s.jpg' % datetime.fromtimestamp(jpg_time).strftime('%H%M%S'))}

        if os.path.isfile(p['src']):
            try:
                log.info('copy {src} to {dst}'.format(**p))
                if not os.path.isdir(os.path.dirname(p['dst'])):
                    os.makedirs(os.path.dirname(p['dst']))
                shutil.copy(**p)
            except Exception:
                log.exception('error while copy jpg to snap dir.')

    def end(self):
        # sample.sample.end(self)
        pass
