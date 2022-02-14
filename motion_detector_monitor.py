# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
from core import logger
import events
import time
from multiprocessing import Process
from core.config import Settings

log = logger.getLogger('kmotion', logger.ERROR)


class Detector(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'detector'
        self.kmotion_dir = kmotion_dir
        self.no_motion_secs = 12
        self.locks = {}
        self.read_thread = None
        self.read_config()

    def read_config(self):
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.events_dir = os.path.join(self.ramdisk_dir, 'events')

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def run(self):
        self.active = True
        log.info('starting daemon [{pid}]'.format(pid=self.pid))
        while self.active and len(self.config['feeds']) > 0:
            try:
                for ev in os.listdir(self.events_dir):
                    try:
                        evf = os.path.join(self.events_dir, ev)
                        last_event_time = events.get_event_time(evf)
                        if self.config['feeds'][int(ev)].get('ext_motion_detector', False) and (time.time() - last_event_time) >= self.no_motion_secs:
                            events.Events(self.kmotion_dir, ev, events.STATE_END).end()
                    except Exception as e:
                        log.error(e)

                self.sleep(1)
            except Exception as e:
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info('stop {name}'.format(name=__name__))
        self.active = False


if __name__ == '__main__':
    log.debug('start motion detector monitor')
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    detector = Detector(kmotion_dir)
    detector.start()
    detector.join()
