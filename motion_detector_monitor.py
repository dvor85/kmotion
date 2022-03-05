# -*- coding: utf-8 -*-

from core import logger
import events
import time
from multiprocessing import Process
from pathlib import Path
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
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.events_dir = Path(self.ramdisk_dir, 'events')

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
        log.info(f'starting daemon [{self.pid}]')
        while self.active and len(self.config['feeds']) > 0:
            try:
                for evf in self.events_dir.iterdir():
                    try:
                        last_event_time = events.get_event_change_time(evf)
                        if self.config['feeds'][int(evf.name)].get('ext_motion_detector', False) and (time.time() - last_event_time) >= self.no_motion_secs:
                            events.Events(self.kmotion_dir, evf.name, events.STATE_END).end()
                    except Exception as e:
                        log.error(e)

                self.sleep(1)
            except Exception as e:
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info(f'stop {__name__}')
        self.active = False


if __name__ == '__main__':
    log.debug('start motion detector monitor')
    kmotion_dir = Path(__file__).absolute().parent.parent
    detector = Detector(kmotion_dir)
    detector.start()
    detector.join()
