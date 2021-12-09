#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import sys
import subprocess
from core import logger
from six.moves import cPickle
import time
from core.actions import actions
import os
from core import utils
from core.config import Settings

STATE_START = 'start'
STATE_END = 'end'

log = logger.Logger('kmotion', logger.DEBUG)


def set_event_time(event_file):
    with open(event_file, 'wb') as dump:
        cPickle.dump(time.time(), dump)


def get_event_time(event_file):
    try:
        with open(event_file, 'rb') as dump:
            return cPickle.load(dump)
    except Exception:
        return time.time()


def set_state(state_file, state):
    with open(state_file, 'wb') as dump:
        cPickle.dump(state, dump)


def get_state(state_file, state=STATE_END):
    try:
        with open(state_file, 'rb') as dump:
            return cPickle.load(dump)
    except Exception:
        return state


class Events:

    def __init__(self, kmotion_dir, feed, state):
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)

        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']

        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        self.state_file = os.path.join(self.ramdisk_dir, 'states', str(self.feed))
        self.state = state
        self.set_last_state(self.state)

    def set_last_state(self, state):
        return set_state(self.state_file, state)

    def get_last_state(self):
        return get_state(self.state_file, self.state)

    def set_event_time(self):
        return set_event_time(self.event_file)

    def get_event_time(self):
        return get_event_time(self.event_file)

    def main(self):
        if len(self.get_prev_instances()) == 0:
            if self.state == STATE_START:
                self.start()
            elif self.state == STATE_END:
                self.end()
            else:
                log.error('command "{0}" not recognized'.format(self.state))
        else:
            log.debug('{file} {feed} already running'.format(**{'file': os.path.basename(__file__), 'feed': self.feed}))

    def start(self):
        self.state = STATE_START
        if not os.path.isfile(self.event_file):
            log.debug('start: creating: {0}'.format(self.event_file))
            self.set_event_time()

        actions.Actions(self.kmotion_dir, self.feed).start()
        if self.get_last_state() != self.state:
            self.end()

    def end(self):
        self.state = STATE_END
        actions.Actions(self.kmotion_dir, self.feed).end()

        if os.path.isfile(self.event_file):
            log.debug('end: delete {0}'.format(self.event_file))
            os.unlink(self.event_file)

        if self.get_last_state() != self.state:
            self.start()

    def get_prev_instances(self):
        try:
            stdout = utils.uni(subprocess.check_output('pgrep -f "^python.+%s %i.*"' % (os.path.basename(__file__), self.feed), shell=True))
            return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
        except Exception:
            return []


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
