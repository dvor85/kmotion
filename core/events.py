#!/usr/bin/env python


import sys
import subprocess
import logger
import cPickle
import time
import actions.actions as actions
import os
from config import ConfigRW


STATE_START = 'start'
STATE_END = 'end'

log = logger.Logger('kmotion', logger.DEBUG)


class Events:

    def __init__(self, kmotion_dir, feed, state):
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)

        config = ConfigRW(kmotion_dir).read_main()
        self.ramdisk_dir = config['ramdisk_dir']
        self.images_dbase_dir = config['images_dbase_dir']

        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        self.state_file = os.path.join(self.ramdisk_dir, 'states', str(self.feed))
        self.state = state
        self.setLastState(self.state)

    def setLastState(self, state):
        with open(self.state_file, 'wb') as dump:
            cPickle.dump(state, dump)

    def getLastState(self):
        try:
            with open(self.state_file, 'rb') as dump:
                return cPickle.load(dump)
        except Exception:
            return self.state

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
            with open(self.event_file, 'wb'):
                pass

        actions.Actions(self.kmotion_dir, self.feed).start()
        if self.getLastState() != self.state:
            self.end()

    def end(self):

        self.state = STATE_END
        actions.Actions(self.kmotion_dir, self.feed).end()

        if os.path.isfile(self.event_file):
            log.debug('end: delete {0}'.format(self.event_file))
            os.unlink(self.event_file)

        if self.getLastState() != self.state:
            self.start()

    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^python.+%s %i.*"' %
                                 (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
