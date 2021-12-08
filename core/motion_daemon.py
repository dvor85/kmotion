# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
'''
@author: demon
'''
import os
import time
import subprocess
from core.init_motion import InitMotion
from multiprocessing import Process
from core import logger
import requests
from core.config import Settings
from six import iterkeys, iteritems


log = logger.Logger('kmotion', logger.DEBUG)


class MotionDaemon(Process):
    '''
    classdocs
    '''

    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        Process.__init__(self)
        self.name = 'motion_daemon'
        self.active = False
        self.daemon = True
        self.kmotion_dir = kmotion_dir
        self.init_motion = InitMotion(self.kmotion_dir)
        self.motion_daemon = None
        self.stop_motion()
        cfg = Settings.get_instance(kmotion_dir)
        self.config = cfg.get('www_rc')

    def feed2thread(self, feed):
        return sorted([f for f in iterkeys(self.config['feeds'])
                       if self.config['feeds'][f].get('feed_enabled', False)]).index(feed) + 1

    def count_motion_running(self):
        return len(subprocess.check_output('pgrep -f "^motion.+-c.*"', shell=True).splitlines())

    def is_port_alive(self, port):
        return subprocess.check_output('netstat -ntl | grep %i' % port, shell=True) != ''

    def pause_motion_detector(self, thread):

        try:
            res = requests.get("http://localhost:8080/{feed_thread}/detection/pause".format(feed_thread=thread))
            res.raise_for_status()
            log.debug('pause detection feed_thread {feed_thread} success'.format(feed_thread=thread))
            return True
        except Exception:
            log.debug('pause detection feed_thread {feed_thread} failed with status code {code}'.format(
                feed_thread=thread, code=res.getcode()))

    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'

        self.init_motion.gen_motion_configs()
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir):
            #             self.init_motion.init_motion_out()  # clear 'motion_out'
            log.info('starting motion')
            self.motion_daemon = subprocess.Popen(
                ['motion', '-c', '{kmotion_dir}/core/motion_conf/motion.conf'.format(kmotion_dir=self.kmotion_dir), '-d', '4'],
                close_fds=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                shell=False)
            motion_out = os.path.join(self.kmotion_dir, 'www/motion_out')
            subprocess.Popen('grep --line-buffered -v "saved to"',
                             shell=True,
                             close_fds=True,
                             stdout=open(motion_out, 'w'),
                             stderr=subprocess.STDOUT,
                             stdin=self.motion_daemon.stdout)
        else:
            log.error('no motion.conf, motion not active')

    def stop(self):
        log.debug('stop {name}'.format(name=__name__))
        self.active = False
        self.stop_motion()

    def stop_motion(self):
        if self.motion_daemon is not None:
            log.debug('kill motion daemon')
            self.motion_daemon.kill()
            self.motion_daemon = None

        subprocess.call('pkill -f "^motion.+-c.*"', shell=True)
        while self.count_motion_running() > 0:
            subprocess.call('pkill -9 -f "^motion.+-c.*"', shell=True)

        log.info('motion killed')

    def run(self):
        """
        args    :
        excepts :
        return  : none
        """
        self.active = True
        while self.active:
            try:
                if not self.is_port_alive(8080):
                    self.stop_motion()
                if self.count_motion_running() != 1:
                    self.stop_motion()
                    self.start_motion()

                for feed, conf in iteritems(self.config['feeds']):
                    if conf.get('feed_enabled', False) and conf.get('motion_detector', 1) == 0:
                        self.pause_motion_detector(self.feed2thread(feed))

#                 raise Exception('motion killed')

            except Exception:  # global exception catch
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
