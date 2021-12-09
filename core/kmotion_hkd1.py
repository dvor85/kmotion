#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

"""
Checks the size of the images directory deleteing the oldest directorys first
when 90% of max_size_gb is reached. Responds to a SIGHUP by re-reading its
configuration. Checks the current kmotion software version every 24 hours.
"""

import time
from core import logger
from core.www_logs import WWWLog
from multiprocessing import Process
import subprocess
from core import utils
import os
from core.config import Settings

log = logger.Logger('kmotion', logger.DEBUG)


class Kmotion_Hkd1(Process):

    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'hkd1'
        self.images_dbase_dir = ''  # the 'root' directory of the images dbase
        self.kmotion_dir = kmotion_dir
        self.max_size_gb = 0  # max size permitted for the images dbase
        self.motion_log = os.path.join(self.kmotion_dir, 'www', 'motion_out')
        self.www_logs = WWWLog(self.kmotion_dir)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def read_config(self):
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        self.images_dbase_dir = config_main['images_dbase_dir']
        self.max_size_gb = config_main['images_dbase_limit_gb'] * 2 ** 30

    def truncate_motion_logs(self):
        try:
            with open(self.motion_log, 'r+') as f_obj:
                events = f_obj.read().splitlines()
                if len(events) > 500:  # truncate logs
                    events = events[-500:]
                    f_obj.seek(0)
                    f_obj.write('\n'.join(events))
                    f_obj.truncate()
        except Exception:
            log.exception('truncate motion logs error')

    def run(self):
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes

        args    :
        excepts :
        return  : none
        """
        self.active = True
        log.info('starting daemon ...')
        while self.active:
            try:
                self.read_config()

                while self.sleep(15 * 60):
                    self.truncate_motion_logs()

                    # if > 90% of max_size_gb, delete oldest
                    if self.images_dbase_size() > self.max_size_gb * 0.9:
                        log.info('image storage limit reached')

                        dir_ = os.listdir(self.images_dbase_dir)
                        dir_.sort()

                        # if need to delete current recording, shut down kmotion
                        for d in dir_:
                            try:
                                fulld = os.path.join(self.images_dbase_dir, d)
                                if time.strftime('%Y%m%d') == d:
                                    log.error('** CRITICAL ERROR ** crash - delete todays data, \'images_dbase\' is too small')
                                    self.www_logs.add_no_space_event()

                                log.info('try to delete {dir}'.format(dir=fulld))
                                if utils.rmdir(fulld):
                                    self.www_logs.add_deletion_event(d)
                                    break
                            except Exception as e:
                                log.error('deleting of "{dir}" error: {error}'.format(dir=fulld, error=e))

            except Exception as e:  # global exception catch
                log.error('** CRITICAL ERROR **')
                log.exception(e)
                self.sleep(60)

    def stop(self):
        log.debug('stop {name}'.format(name=__name__))
        self.active = False

    def images_dbase_size(self):
        """
        Returns the total size of the images directory

        args    :
        excepts :
        return  : int ... the total size of the images directory in bytes
        """

        # the following rather elaborate system is designed to lighten the
        # server load. if there are 10's of thousands of files a simple  'du -h'
        # on the images_dbase_dir could potentially peg the server for many
        # minutes. instead an average size system is implemented to calculate
        # the images_dbase_dir size.

        # check todays dir exists in case kmotion_hkd1 passes 00:00 before
        # motion daemon

        self.update_dbase_sizes()

        bytes_ = 0
        for date in os.listdir(self.images_dbase_dir):
            date_dir = os.path.join(self.images_dbase_dir, date)
            if os.path.isfile('%s/dir_size' % date_dir):
                with open('%s/dir_size' % date_dir, 'r') as f_obj:
                    bytes_ += int(f_obj.readline())

        log.debug('images_dbase_size() - size : %s' % bytes_)
        return bytes_

    def update_dbase_sizes(self):
        """
        Scan all date dirs for 'dir_size' and if not present calculate and
        create 'dir_size', special case, skip 'today'

        args    :
        excepts :
        return  : none
        """

        dates = os.listdir(self.images_dbase_dir)
        dates.sort()

        for date in dates:
            date_dir = os.path.join(self.images_dbase_dir, date)

            # skip update if 'dir_size' exists and 'date' != 'today'
            if os.path.isfile(os.path.join(date_dir, 'dir_size')) and date != time.strftime('%Y%m%d'):
                continue

            bytes_ = 0
            feeds = os.listdir(date_dir)
            feeds.sort()

            for feed in feeds:
                feed_dir = '%s/%s' % (date_dir, feed)

                # motion daemon may not have created all needed dirs, so only check
                # the ones that have been created
                if os.path.isdir('%s/movie' % feed_dir):
                    bytes_ += self.get_size_dir('%s/movie' % feed_dir)

                if os.path.isdir('%s/snap' % feed_dir):
                    bytes_ += self.get_size_dir('%s/snap' % feed_dir)

            log.debug('update_dbase_sizes() - size : %s' % bytes_)

            with open('%s/dir_size' % date_dir, 'w') as f_obj:
                f_obj.write(str(bytes_))

    def get_size_dir(self, dir_):
        """
        Returns the size of dir in bytes.

        args    : feed_dir ... the full path to the dir
        excepts :
        return  : int ...      the size of dir in bytes
        """

        # don't use os.path.getsize as it does not report disk useage
        _bytes = 0
        try:
            line = utils.uni(subprocess.check_output('nice -n 19 du -s %s' % dir_, shell=True))
            bytes_ = int(line.split()[0]) * 1000
        except Exception:
            _bytes = utils.get_size(dir_)
        finally:
            log.debug('size of %s = %s' % (dir_, bytes_))
            return bytes_
