'''

@author: demon
'''
import threading
from multiprocessing import Process
import os, sys, time, traceback
import logger, events
from mutex_parsers import *



class Kmotion_split(Process):
    '''
    classdocs
    '''
    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        Process.__init__(self)
        self.kmotion_dir = kmotion_dir
        self.log = logger.Logger('kmotion_split', logger.DEBUG)
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.events_dir = os.path.join(self.ramdisk_dir, 'events')
        self.max_duration = 180
        self.semaphore = threading.Semaphore(8)
        self.locks = {}
        
    def main(self, feed):
        if not self.locks.has_key(feed):
            self.locks[feed] = threading.Lock()
        lock = self.locks.get(feed)
        
        self.semaphore.acquire()
        try:
            lock.acquire()
            try:
                event_file = os.path.join(self.events_dir, feed)              
                
                if os.path.isfile(event_file) and (time.time() - os.path.getmtime(event_file)) >= self.max_duration:
                    self.log('split feed %s' % (feed), logger.DEBUG)
                    events.Events(self.kmotion_dir, feed, events.STATE_START).end()
            finally:
                lock.release()
        finally:
            self.semaphore.release()
        
        
    def run(self):
        self.log('starting daemon ...', logger.CRIT)
        while True:
            try:
                time.sleep(15)
                events = os.listdir(self.events_dir)
                for event in events:
                    threading.Thread(target=self.main,args=(event,)).start()
                
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                 
                self.log('** CRITICAL ERROR ** crash - type: %s' 
                           % exc_type, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - value: %s' 
                           % exc_value, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc1, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc2, logger.CRIT)
                time.sleep(60)
                
