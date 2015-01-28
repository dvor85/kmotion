#!/usr/bin/env python
'''
@author: demon
'''

import logger, subprocess, os, sys


class CameraLost(object):
    '''
    classdocs
    '''
    def __init__(self, kmotion_dir, feed):        
        self.logger = logger.Logger('camera_lost', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
                
    def main(self):
        if len(self.get_prev_instances()) == 0:
            self.lost(os.path.join(self.kmotion_dir, 'feed/lost.sh'))
        else:
            self.logger('{file} {feed} already running'.format(**{'file':os.path.basename(__file__),'feed':self.feed}), logger.CRIT)
            
    def lost(self, exe_file):      
        if os.path.isfile(exe_file):
            self.logger('executing: %s' % exe_file, logger.CRIT)
            subprocess.Popen(['nice', '-n', '20', exe_file, str(self.feed)])
            
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f ".*%s %i$"' % (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    CameraLost(kmotion_dir, sys.argv[1]).main()
        
