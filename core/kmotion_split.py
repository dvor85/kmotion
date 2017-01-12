'''

@author: demon
'''
import threading
from multiprocessing import Process
import sys
import time
import traceback
import logger
import events
from mutex_parsers import *

log = logger.Logger('split', logger.Logger.DEBUG)


class Kmotion_split(Process):
    '''
    classdocs
    '''

    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        Process.__init__(self)
        self.name = 'split'
        self.active = False
        self.daemon = True
        self.kmotion_dir = kmotion_dir
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.events_dir = os.path.join(self.ramdisk_dir, 'events')
        self.max_duration = 180
        self.semaphore = threading.Semaphore(8)
        self.locks = {}

    def main(self, feed):
        if feed not in self.locks:
            self.locks[feed] = threading.Lock()
        lock = self.locks.get(feed)

        self.semaphore.acquire()
        try:
            lock.acquire()
            try:
                event_file = os.path.join(self.events_dir, feed)

                if os.path.isfile(event_file) and (time.time() - os.path.getmtime(event_file)) >= self.max_duration:
                    log.d('split feed %s' % (feed))
                    events.Events(self.kmotion_dir, feed, events.STATE_START).end()
            finally:
                lock.release()
        finally:
            self.semaphore.release()

    def run(self):
        log('starting daemon ...')
        self.active = True
        while self.active:
            try:
                self.sleep(15)
                events = os.listdir(self.events_dir)
                for event in events:
                    threading.Thread(target=self.main, args=(event,)).start()

            except:
                exc_type, exc_value, exc_tb = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_tb)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])

                log.e('** CRITICAL ERROR ** crash - type: %s' % exc_type)
                log.e('** CRITICAL ERROR ** crash - value: %s' % exc_value)
                log.e('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc1)
                log.e('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc2)
                del(exc_tb)
                self.sleep(60)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)

    def stop(self):
        self.active = False
