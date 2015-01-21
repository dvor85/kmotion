'''

@author: demon
'''
from threading import Thread
import os, sys, signal, time, traceback
import logger
from mutex_parsers import *
from subprocess import *


class Kmotion_split(Thread):
    '''
    classdocs
    '''
    log_level = 'WARNING'

    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        Thread.__init__(self)
        self.setName('kmotion_split')
        self.setDaemon(True)
        self.kmotion_dir = kmotion_dir
        self.logger = logger.Logger('kmotion_split', Kmotion_split.log_level)
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.events_dir = os.path.join(self.ramdisk_dir, 'events')
        self.states_dir = os.path.join(self.ramdisk_dir, 'states')
        self.max_duration = 3 * 60
        self.event_end = os.path.join(self.kmotion_dir, 'event/stop.sh')
        self.event_start = os.path.join(self.kmotion_dir, 'event/start.sh')
        
    def stop(self):
        os.kill(os.getpid(), signal.SIGTERM)
        
    def main(self, event):
        state_file = os.path.join(self.states_dir, event)
        self.logger.log('event = %s' % (event), 'DEBUG')
        
        if not os.path.isfile(state_file) and (time.time() - os.path.getmtime(os.path.join(self.events_dir, event))) >= self.max_duration:
            
            with open(state_file, 'w'):
                pass
            if os.path.isfile(self.event_end):
                self.logger.log('event %s stop' % event, 'DEBUG')
                Popen([self.event_end, event]).wait()
            
            if os.path.isfile(state_file) and os.path.isfile(self.event_start):
                self.logger.log('event %s start' % event, 'DEBUG')
                os.unlink(state_file)
                Popen([self.event_start, event]) 
        
        
    def run(self):
        self.logger.log('starting daemon ...', 'CRIT')
        while True:
            try:
                events = os.listdir(self.events_dir)
                for event in events:
                    Thread(target=self.main,args=(event,)).start()
                time.sleep(60)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                 
                self.logger.log('** CRITICAL ERROR ** crash - type: %s' 
                           % exc_type, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** crash - value: %s' 
                           % exc_value, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc1, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc2, 'CRIT')
                time.sleep(60)
                
