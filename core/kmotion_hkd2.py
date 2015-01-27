#!/usr/bin/env python

# Copyright 2008 David Selby dave6502@googlemail.com

# This file is part of kmotion.

# kmotion is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# kmotion is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with kmotion.  If not, see <http://www.gnu.org/licenses/>.

"""
Copys, moves or deletes files from images_dbase_dir/tmp to images_dbase_dir/snap
generating a 'sanitized' snap sequence. Also updates journals. On SIGHUP
force a config re-read.
"""

import os, sys, time, signal, shutil, ConfigParser, traceback
import logger
from mutex_parsers import *
from mutex import Mutex
from threading import Thread , Semaphore, Lock
from multiprocessing import Process
from subprocess import *


log_level = logger.WARNING
logger = logger.Logger('kmotion_hkd2', log_level)


class Hkd2_Feed():
    
    def __init__(self, kmotion_dir, feed, semaphore):
        self.kmotion_dir = kmotion_dir  # the 'root' directory of kmotion
        self.feed = feed  # the feed number 1 - 16
        self.ramdisk_dir = ''  # the 'root' dir of the ramdisk
        self.images_dbase_dir = ''  # the 'root' dir of the images dbase
        self.feed_enabled = True  # feed enabled 
        self.feed_snap_enabled = True  # feed snap enabled
        self.feed_snap_interval = ''  # snap interval in seconds
        self.feed_fps = ''  # frame fps
        self.feed_name = ''  # feed name
        self.old_date = ''  # old date
        self.epoch_time = time.time()  # secs since epoch
        self.lock = Lock()
        self.semaphore = semaphore
        self.read_config()
                
        
    def read_config(self):
        """
        Read configs from kmotion_rc, kmotion_rc and www_rc.
        
        args    :
        excepts : 
        return  : none
        """
                
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        try:  # try - except because kmotion_rc is user changeable file
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError): 
            logger.log('** CRITICAL ERROR ** corrupt \'kmotion_rc\': %s' % 
                       sys.exc_info()[1], logger.CRIT)
            logger.log('** CRITICAL ERROR ** killing all daemons and terminating', logger.CRIT)
            self.daemon_whip.stop()
            
        parser = mutex_www_parser_rd(self.kmotion_dir) 
        self.feed_enabled = parser.getboolean('motion_feed%02i' % self.feed, 'feed_enabled')
        self.feed_snap_enabled = parser.getboolean('motion_feed%02i' % self.feed, 'feed_snap_enabled')
        self.feed_snap_interval = parser.getint('motion_feed%02i' % self.feed, 'feed_snap_interval')
        self.feed_fps = parser.getint('motion_feed%02i' % self.feed, 'feed_fps')
        self.feed_name = parser.get('motion_feed%02i' % self.feed, 'feed_name')
        
    
    def main(self):
        """ 
        Copys, moves or deletes files from 'ramdisk_dir/kmotion' to
        'images_dbase_dir/snap' generating a 'sanitized' snap sequence. Also
        updates snap_journal.
        
        args    : 
        excepts : 
        return  : none
        """
        self.semaphore.acquire()
        try:
            self.lock.acquire()
            try:
                date, time_ = self.current_date_time()
                 
                # if dates mismatch, its a new day 
                if self.feed_enabled and date != self.old_date: 
                    
                    self.old_date = date 
                    logger.log('service_snap() - new day, feed: %s date: %s' % (self.feed, date), logger.DEBUG) 
                        
                    feed_dir = '%s/%s/%02i' % (self.images_dbase_dir, date, self.feed)
                    try:  # make sure 'feed_dir' exists, try in case motion creates dir
                        os.makedirs(feed_dir)
                    except OSError:
                        pass
                    
                    # update the snap and smovie fps journals 
                    self.update_snap_journal(date, self.feed_enabled and self.feed_snap_enabled,
                                             time_, self.feed_snap_interval)
                    self.update_fps_journal(date, time_, self.feed_fps)
                    self.update_title(date)
                
                # process and sanitise snap timestamps
                if self.feed_enabled: 
                    
                    tmp_snap_dir = '%s/%02i' % (self.ramdisk_dir, self.feed) 
                    snap_list = os.listdir(tmp_snap_dir)
                    snap_list.sort()
                    
                    # need this > 25 buffer to ensure kmotion can view jpegs before we 
                    # move or delete them
                    while (len(snap_list) >= 25):  
                        
                        snap_date_time = snap_list[0][:-4]  # [:-4] to strip '.jpg'
                        
                        # if snap is disabled, delete old jpegs but keep time in sync
                        if not self.feed_snap_enabled:
                            logger.log('service_snap() - ditch %s/%s.jpg' 
                                       % (tmp_snap_dir, snap_date_time), logger.DEBUG)
                            if snap_date_time != 'last':
                                os.remove('%s/%s.jpg' % (tmp_snap_dir, snap_date_time))
                                feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                                if os.path.isfile(feed_www_jpg):
                                    os.remove(feed_www_jpg)
                            if snap_date_time > date + time_: 
                                self.inc_date_time(2)
                            snap_list = snap_list[1:]
                            continue
                        
                        # if jpeg is in the past, delete it
                        if snap_date_time < date + time_: 
                            logger.log('service_snap() - delete %s/%s.jpg' 
                                       % (tmp_snap_dir, snap_date_time), logger.DEBUG)
                            if snap_date_time != 'last':
                                os.remove('%s/%s.jpg' % (tmp_snap_dir, snap_date_time))
                                feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                                if os.path.isfile(feed_www_jpg):
                                    os.remove(feed_www_jpg)
                            snap_list = snap_list[1:]
                            continue
                        
                        # need date time update here in case 00:00 crossed
                        date, time_ = self.current_date_time()
                        snap_dir = '%s/%s/%02i/snap' % (self.images_dbase_dir, date, self.feed)
                        
                        # make sure 'snap_dir' exists, try in case motion creates dir
                        if not os.path.isdir(snap_dir):
                            try:  
                                os.makedirs(snap_dir)
                            except OSError:
                                pass
                            
                        # if jpeg is in the future, copy but don't delete
                        if snap_date_time > date + time_: 
                            logger.log('service_snap() - copy %s/%s.jpg %s/%s.jpg' 
                                       % (tmp_snap_dir, snap_date_time, snap_dir,
                                          time_), logger.DEBUG)               
                            shutil.copy('%s/%s.jpg' % (tmp_snap_dir, snap_date_time), '%s/%s.jpg' 
                                      % (snap_dir, time_))
                            self.inc_date_time(self.feed_snap_interval)
                            
                        
                        # if jpeg is now, move it
                        elif snap_date_time == date + time_:  
                            logger.log('service_snap() - move %s/%s.jpg %s/%s.jpg' 
                                       % (tmp_snap_dir, snap_date_time, snap_dir,
                                          time_), logger.DEBUG)  
                            Popen('mv %s/%s.jpg %s/%s.jpg' % (tmp_snap_dir, snap_date_time, snap_dir, time_), shell=True).wait()
                            feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                            if os.path.isfile(feed_www_jpg):
                                os.remove(feed_www_jpg)
                            self.inc_date_time(self.feed_snap_interval)
                            snap_list = snap_list[1:]
            finally:
                self.lock.release() 
        finally:
            self.semaphore.release()
            
        
        
    def update_snap_journal(self, date, enabled, time_, pause):
        """ 
        Given the date, feed number, time and pause in seconds updates 
        'snap_journal'
        
        args    : date ...    date 
                  feed ...    feed 
                  enabled ... feed enabled
                  time_ ...   time
                  pause ...   snap pause between frames in time
        excepts : 
        return  : none
        """
        
        # add to 'snap_journal' #<snap start time_>$<snap pause secs_>
        if not enabled:  # if snap disabled, write pause zero to journal 
            pause = 0
            
        snap_journal = '%s/%s/%02i/snap_journal' % (self.images_dbase_dir, date, self.feed)
      
        with open(snap_journal, 'a') as f_obj:
            f_obj.write('$%s#%s\n' % (time_, pause))
              
        
    def update_fps_journal(self, date, time_, fps):
        """ 
        Given the date, feed number, time and fps updates 'fps_journal'
        
        args    : date ...    date 
                  feed ...    feed 
                  time_ ...   time
                  fps ...     smovie fps
        excepts : 
        return  : none
        """
        
        # add to 'fps_journal' #<fps start time_>$<frame fps>
        smovie_fps_journal = '%s/%s/%02i/fps_journal' % (self.images_dbase_dir, date, self.feed)
      
        with open(smovie_fps_journal, 'a') as f_obj:
            f_obj.write('$%s#%s\n' % (time_, fps))
        
        
    def update_title(self, date):
        """ 
        Given the date and feed number updates 'title'
        
        args    : date ...   date 
                  feed ...   feed 
                  name ...   name
        excepts : 
        return  : none
        """
        
        # updates 'name' with name string
        title = '%s/%s/%02i/title' % (self.images_dbase_dir, date, self.feed)
      
        with open(title, 'w') as f_obj:
            f_obj.write(self.feed_name)
        
        
    def inc_date_time(self, inc_secs):
        """ 
        Adds inc_secs seconds to the self.epoch_time
        
        args    : inc_secs ... the secs to increment
        excepts : 
        return  : 
        """
        
        self.epoch_time += inc_secs
        
        
    def current_date_time(self):
        """ 
        Returns the self.epoch_time as a tuple of two strings, YYYYMMDD and
        HHMMSS
        
        args    : 
        excepts : 
        return  : (string, string) ...  YYYYMMDD and HHMMSS
        """
        
        time_obj = time.localtime(self.epoch_time)
        return (time.strftime('%Y%m%d', time_obj), time.strftime('%H%M%S', time_obj))
            
            
    
class Kmotion_Hkd2(Process):
    
    
    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.kmotion_dir = kmotion_dir
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.max_feed = parser.getint('misc', 'max_feed')
        self.semaphore = Semaphore(8) 
        
    def run(self):
        """
        Start the hkd2 daemon. This daemon wakes up every 2 seconds
        
        args    :
        excepts : 
        return  : none
        """
        while True:
            try:
                logger.log('starting daemon ...', logger.CRIT)
                self.instance_list = []  # list of Hkd2_Feed instances
                for feed in range(1, self.max_feed):
                    self.instance_list.append(Hkd2_Feed(self.kmotion_dir, feed, self.semaphore))
                while True:
                    for inst in self.instance_list:
                        Thread(target=inst.main).start()
            
                    time.sleep(2)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                 
                logger.log('** CRITICAL ERROR ** crash - type: %s' 
                           % exc_type, logger.CRIT)
                logger.log('** CRITICAL ERROR ** crash - value: %s' 
                           % exc_value, logger.CRIT)
                logger.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc1, logger.CRIT)
                logger.log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc2, logger.CRIT)
                time.sleep(60)



