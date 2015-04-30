
import sys, os, time
import shutil
from datetime import datetime
import sample


class first_snap(sample.sample):
    
    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)
        import core.logger as logger
        self.log = logger.Logger('action_first_snap', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        self.key = 'first_snap'
        try:
            from core.mutex_parsers import mutex_kmotion_parser_rd
            parser = mutex_kmotion_parser_rd(kmotion_dir) 
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            self.log('init - error {type}: {value} while parsing kmotion_rc file'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT)
        
    def start(self):
        sample.sample.start(self)
        jpg_time = time.time()
        jpg = '%s.jpg' % datetime.fromtimestamp(jpg_time).strftime('%Y%m%d%H%M%S')
        jpg_dir = '%s/%02i' % (self.ramdisk_dir, self.feed)
        
        p = {'src':os.path.join(jpg_dir, jpg),
             'dst':os.path.join(self.images_dbase_dir, 
                                datetime.fromtimestamp(jpg_time).strftime('%Y%m%d'), 
                                '%02i' % self.feed,
                                'snap', 
                                '%s.jpg' % datetime.fromtimestamp(jpg_time).strftime('%H%M%S'))}
        
        if os.path.isfile(p['src']):
            try:
                self.log('copy {src} to {dst}'.format(**p), self.log.DEBUG)
                if not os.path.isdir(os.path.dirname(p['dst'])):
                    os.makedirs(os.path.dirname(p['dst']))
                shutil.copy(**p)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                self.log('copy error {type}: {value} while copy jpg to snap dir.'.format(**{'type':exc_type, 'value':exc_value}), self.log.CRIT)
        
        
    def end(self):
        #sample.sample.end(self)
        pass
