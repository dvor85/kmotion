#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import subprocess
from core import logger
from six.moves import cPickle
from six import iteritems
import time
from core.actions import actions
import os
from core import utils
from core.config import Settings
from pathlib import Path

STATE_START = 'start'
STATE_END = 'end'

log = logger.getLogger('kmotion', logger.ERROR)


def set_event_start(event_file):
    event_file = Path(event_file)
    if event_file.exists() and event_file.stat().st_size > 0:
        event_file.touch()
    else:
        with event_file.open(mode='wb') as dump:
            cPickle.dump(time.time(), dump)


def get_event_change_time(event_file):
    event_file = Path(event_file)
    if event_file.exists():
        return event_file.stat().st_mtime
    else:
        return time.time()


def get_event_start_time(event_file):
    event_file = Path(event_file)
    try:
        with event_file.open(mode='rb') as dump:
            return cPickle.load(dump)
    except Exception:
        return get_event_change_time(event_file)


def set_state(state_file, state):
    with Path(state_file).open(mode='wb') as dump:
        cPickle.dump(state, dump)


def get_state(state_file, state=STATE_END):
    try:
        with Path(state_file).open(mode='rb') as dump:
            return cPickle.load(dump)
    except Exception:
        return state


class Events:

    def __init__(self, kmotion_dir, feed_ip, state):
        self.kmotion_dir = kmotion_dir

        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])

        if '.' in feed_ip:
            self.feed = self.find_feed_by_ip(feed_ip)
        else:
            self.feed = int(feed_ip)
        if not self.feed:
            raise ValueError(f"Can't {state} event. {feed_ip} is not configured.")

        self.event_file = Path(self.ramdisk_dir, 'events', str(self.feed))
        self.state_file = Path(self.ramdisk_dir, 'states', str(self.feed))
        self.state = state
        self.set_last_state(self.state)

    def find_feed_by_ip(self, ip):
        log.debug(f'find feed by ip "{ip}"')
        if ip:
            for feed, conf in iteritems(self.config['feeds']):
                if conf.get('feed_enabled', False) and conf.get('ext_motion_detector', False) and ip in conf['feed_url']:
                    return feed

    def set_last_state(self, state):
        return set_state(self.state_file, state)

    def get_last_state(self):
        return get_state(self.state_file, self.state)

    def set_event_start(self):
        return set_event_start(self.event_file)

    def get_event_start_time(self):
        return get_event_start_time(self.event_file)

    def main(self):
        if len(self.get_prev_instances()) == 0:
            if self.state == STATE_START:
                self.start()
            elif self.state == STATE_END:
                self.end()
            else:
                log.error(f'command "{self.state}" not recognized')
        else:
            log.debug(f'{Path(__file__).name} {self.feed} already running')

    def start(self):
        self.state = STATE_START
        must_start_actions = not self.event_file.is_file()

        log.debug(f'start: creating: {self.event_file}')
        self.set_event_start()

        if must_start_actions:
            actions.Actions(self.kmotion_dir, self.feed).start()
        if self.get_last_state() != self.state:
            self.end()

    def end(self):
        self.state = STATE_END
        actions.Actions(self.kmotion_dir, self.feed).end()

        if self.event_file.is_file():
            log.debug(f'end: delete {self.event_file}')
            self.event_file.unlink()

        if self.get_last_state() != self.state:
            self.start()

    def get_prev_instances(self):
        try:
            stdout = utils.uni(subprocess.check_output(['pgrep', '-f', f"^python.+{Path(__file__).name} {self.feed}.*"], shell=False))
            return [pid for pid in stdout.splitlines() if Path('/proc', pid).is_dir() and int(pid) != os.getpid()]
        except Exception:
            return []


if __name__ == '__main__':
    kmotion_dir = Path(__file__).absolute().parent
    try:
        Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
    except Exception as e:
        log.error(e)
