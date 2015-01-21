#!/usr/bin/env python

import os, sys, subprocess
import logger

class EventCameraLost:
    
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir, thread):        
        self.logger = logger.Logger('event_camera_lost', EventCameraLost.log_level)
        self.kmotion_dir = kmotion_dir
        self.thread = thread
        self.exe_file = os.path.join(kmotion_dir, 'event', 'lost.sh')
        
        if len(self.get_prev_instances()) == 0:
            self.start()
        else:
            self.logger.log('%s %s already running' % (os.path.basename(__file__), self.thread), 'CRIT')

    def start(self):      
        if os.path.isfile(self.exe_file):
            self.logger.log('executing: %s' % self.exe_file, 'CRIT')
            subprocess.Popen(['nice', '-n', '20', self.exe_file, self.thread])

    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^.*%s %s$"' % (os.path.basename(__file__), self.thread), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]

if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    EventCameraLost(kmotion_dir, sys.argv[1]) 

