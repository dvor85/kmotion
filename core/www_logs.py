#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

"""
Update the 'logs' file with events and check for any incorrect shutdowns. If
found add an incorrect shutdown warning to the 'logs' file. Implement a mutex
lock to avoid process clashes.

The 'logs' file has the format: $date#time#text$date ...
"""

import os
import time
from core import logger
from core import utils

log = logger.getLogger('kmotion', logger.ERROR)
www_logs = logger.getLogger('www_logs', logger.DEBUG)


class WWWLog:

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.log_file = '/var/log/kmotion/kmotion.log'
        try:
            utils.makedirs(os.path.dirname(self.log_file))
        except Exception:
            log.error(f"Can't create: {self.log_file}")

    def add_startup_event(self):

        log.debug('add_startup_event() - adding startup event')

        error_flag = False
        with open(self.log_file, 'r') as f_obj:
            events = f_obj.read().splitlines()

        for i in range(len(events) - 1, -1, -1):

            if events[i].find('shutting down') > -1 or events[i].find('Initial') > -1:
                error_flag = False
                break

            if events[i].find('starting up') > -1:
                error_flag = True
                break

        if error_flag:
            www_logs.error('Incorrect shutdown')
            log.debug('add_startup_event() - missing \'shutting down\' event - Incorrect shutdown')
        www_logs.info('kmotion starting up')

    def add_shutdown_event(self):
        log.debug('add_shutdown_event() - adding shutdown event')
        www_logs.info('kmotion shutting down')

    def add_deletion_event(self, date):
        log.debug('add_deletion_event() - adding deletion event')
        year = date[:4]
        month = date[4:6]
        day = date[6:8]
        www_logs.info(f'Deleting archive data for {day}/{month}/{year}')

    def add_no_space_event(self):
        log.debug('add_no_space_event() - adding deletion event')
        www_logs.info('Deleting todays data, \'images_dbase\' is too small')


if __name__ == '__main__':
    print('\nModule self test ...\n')
    kmotion_dir = os.path.abspath('..')

    WWWLog(kmotion_dir).add_no_space_event()
