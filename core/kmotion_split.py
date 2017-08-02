'''

@author: demon
'''
import threading
from multiprocessing import Process
import time
import logger
import events
import os
from config import ConfigRW

log = logger.Logger('kmotion', logger.DEBUG)


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
        config_main = ConfigRW(self.kmotion_dir).read_main()
        self.ramdisk_dir = config_main['ramdisk_dir']
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

                if os.path.isfile(event_file) and (time.time() - os.path.getatime(event_file)) >= self.max_duration:
                    log.debug('split feed %s' % (feed))
                    events.Events(self.kmotion_dir, feed, events.STATE_START).end()
            finally:
                lock.release()
        finally:
            self.semaphore.release()

    def run(self):
        log.info('starting daemon ...')
        self.active = True
        while self.active:
            try:
                if self.sleep(15):
                    events = os.listdir(self.events_dir)
                    for event in events:
                        threading.Thread(target=self.main, args=(event,)).start()

            except Exception:
                log.exception('** CRITICAL ERROR **')
                self.sleep(60)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def stop(self):
        log.debug('stop {name}'.format(name=__name__))
        self.active = False
