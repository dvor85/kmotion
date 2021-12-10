# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
from core import logger, utils
import events
import time
import threading
from multiprocessing import Process
from core.config import Settings
from six import iterkeys, iteritems

log = logger.Logger('kmotion', logger.DEBUG)

EXT_DETECTOR = 0
INT_DETECTOR = 1


class Detector(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'detector'
        self.kmotion_dir = kmotion_dir
        self.pipe_file = os.path.join(self.kmotion_dir, 'www/fifo_motion_detector')
        self.no_motion_secs = 10
        self.locks = {}
        self.read_thread = None
        self.read_config()

    def read_config(self):
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')

        self.ramdisk_dir = config_main['ramdisk_dir']

        self.events_dir = os.path.join(self.ramdisk_dir, 'events')

    def find_feed_by_ip(self, ip):
        log.debug('find feed by ip "{0}"'.format(ip))
        if ip:
            for feed, conf in iteritems(self.config['feeds']):
                if conf.get('feed_enabled', False) and \
                        conf.get('motion_detector', INT_DETECTOR) == EXT_DETECTOR and \
                        ip in conf['feed_url']:
                    return feed

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def main(self, feed=None):
        for ev in os.listdir(self.events_dir):
            try:
                if ev != feed:
                    evf = os.path.join(self.events_dir, ev)
                    last_event_time = events.get_event_time(evf)
                    if self.config['feeds'][int(ev)].get('motion_detector', INT_DETECTOR) == EXT_DETECTOR and \
                            (time.time() - last_event_time) >= self.no_motion_secs:
                        events.Events(self.kmotion_dir, ev, events.STATE_END).end()
            except Exception as e:
                pass

        try:

            if feed is not None and int(feed) > 0 and feed in iterkeys(self.config['feeds']):
                log.debug('main {0}'.format(feed))
                if feed not in self.locks:
                    self.locks[feed] = threading.Lock()
                lock = self.locks.get(feed)
                event_file = os.path.join(self.events_dir, feed)

                with lock:
                    if not os.path.isfile(event_file):
                        events.Events(self.kmotion_dir, feed, events.STATE_START).start()
        except ValueError:
            pass

    def read_pipe(self, timeout):
        pipein = os.open(self.pipe_file, os.O_RDONLY | os.O_NONBLOCK)
        try:
            if self.sleep(timeout):
                data = utils.uni(os.read(pipein, 256))
            return data
        except Exception as e:
            log.debug(e)
        finally:
            os.close(pipein)

    def run(self):
        self.active = True
        appendix = ''
        log.info('starting daemon ...')
        while self.active and len(self.config['feeds']) > 0:
            try:
                data = self.read_pipe(1)
                if data:
                    log.debug('received data = "{0}"'.format(data))
                    last_n = data.rfind('\n')
                else:
                    last_n = -1
                    appendix = ''

                if last_n > -1:
                    data = appendix + data
                    appendix = data[last_n:]
                    data = data[:last_n]
                    datas = data.splitlines()
                    for ip in utils.uniq(datas):
                        if ip:
                            log.debug('ip = "{0}"'.format(ip))
                            feed = self.find_feed_by_ip(ip)
                            log.debug('feed = "{0}"'.format(feed))
                            threading.Thread(target=self.main, args=(str(feed),)).start()
                else:
                    threading.Thread(target=self.main).start()

            except Exception as e:
                log.exception(e)

    def stop(self):
        log.debug('stop {name}'.format(name=__name__))
        self.active = False


if __name__ == '__main__':
    log.debug('start motion detector')
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    detector = Detector(kmotion_dir)
    detector.start()
    detector.join()