# -*- coding: utf-8 -*-
'''

@author: demon
'''
import threading
from multiprocessing import Process
import time
from core import logger
import events
from core.config import Settings
from pathlib import Path

log = logger.getLogger('kmotion', logger.ERROR)


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
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.events_dir = Path(self.ramdisk_dir, 'events')
        self.max_duration = config_main.get('video_length', 300)
        self.semaphore = threading.Semaphore(8)
        self.locks = {}

    def main(self, feed):
        if feed not in self.locks:
            self.locks[feed] = threading.Lock()
        lock = self.locks.get(feed)

        with self.semaphore:
            with lock:
                event_file = Path(self.events_dir, feed)

                if (time.time() - events.get_event_start_time(event_file)) >= self.max_duration:
                    log.debug(f'split feed {feed}')
                    events.Events(self.kmotion_dir, feed, events.STATE_START).end()

    def run(self):
        log.info(f'starting daemon [{self.pid}]')
        self.active = True
        while self.active:
            try:
                if self.sleep(15):
                    for event in self.events_dir.iterdir():
                        threading.Thread(target=self.main, args=(event.name,)).start()

            except Exception:
                log.critical('** CRITICAL ERROR **', exc_info=1)
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
        log.info(f'stop {__name__}')
        self.active = False
