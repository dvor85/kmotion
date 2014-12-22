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

import os, sys, time, signal, shutil, traceback

from core.daemon_control import DaemonControl
from mutex_parsers import *
import logger


log_level = 'WARNING'
logger = logger.Logger('kmotion_hkd2', log_level)


class Hkd2_Feed:
    
    
    def __init__(self, kmotion_dir, feed):
        
        self.kmotion_dir = kmotion_dir  # the 'root' directory of kmotion
        self.feed = feed                 
        self.epoch_time = time.time()  # secs since epoch 
        self.reload_flag = False  # true if reload required
        self.daemonControl = DaemonControl(self.kmotion_dir)  
        
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
                       sys.exc_info()[1], 'CRIT')
            logger.log('** CRITICAL ERROR ** killing all daemons and terminating', 'CRIT')
            self.daemonControl.kill_daemons()
            
        parser = mutex_www_parser_rd(self.kmotion_dir) 
        self.feed_enabled = parser.getboolean('motion_feed%02i' % self.feed, 'feed_enabled')
        self.feed_snap_enabled = parser.getboolean('motion_feed%02i' % self.feed, 'feed_snap_enabled')
        self.feed_snap_interval = parser.getint('motion_feed%02i' % self.feed, 'feed_snap_interval')
        self.feed_fps = parser.getint('motion_feed%02i' % self.feed, 'feed_fps')
        self.feed_name = parser.get('motion_feed%02i' % self.feed, 'feed_name')
        
    
    def service_snap(self):
        """ 
        Copys, moves or deletes files from 'ramdisk_dir/kmotion' to
        'images_dbase_dir/snap' generating a 'sanitized' snap sequence. Also
        updates snap_journal.
        
        args    : 
        excepts : 
        return  : none
        """
        
        date, time_ = self.current_date_time()
         
        if self.reload_flag:  # if 'self.reload_flag', reload the config
            self.reload_flag = False
            
            old_feed_enabled = self.feed_enabled
            old_snap_enabled = self.feed_snap_enabled
            self.read_config()
            
            # if feed or snap just enabled, update 'epoch_time'
            if (not old_feed_enabled and self.feed_enabled) or (not old_snap_enabled and self.feed_snap_enabled):
                self.epoch_time = time.time()
                date, time_ = self.current_date_time()
                        
            # if feed enabled or just disabled, update journals
            if self.feed_enabled or (old_feed_enabled and not self.feed_enabled):
                    
                feed_dir = '%s/%s/%02i' % (self.images_dbase_dir, date, self.feed)
                if not os.path.isdir(feed_dir):
                    os.makedirs(feed_dir)
                
                # update smovie fps journals                
                self.update_fps_journal(date, self.feed, time_, self.feed_fps)
                self.update_title(date, self.feed, self.feed_name)
                
        # if dates mismatch, its a new day 
        if self.feed_enabled and date != self.old_date: 
            
            self.old_date = date 
            logger.log('service_snap() - new day, feed: %s date: %s' % (self.feed, date), 'DEBUG') 
                
            feed_dir = '%s/%s/%02i' % (self.images_dbase_dir, date, self.feed)
            if not os.path.isdir(feed_dir):
                os.makedirs(feed_dir)
            
            # update smovie fps journals 
            self.update_fps_journal(date, self.feed, time_, self.feed_fps)
            self.update_title(date, self.feed, self.feed_name)
        
        # process and sanitise snap timestamps
        if self.feed_enabled: 
            
            tmp_snap_dir = '%s/%02i' % (self.ramdisk_dir, self.feed) 
            snap_list = os.listdir(tmp_snap_dir)
            snap_list.sort()
            
            # need this > 25 buffer to ensure kmotion can view jpegs before we 
            # move or delete them
            while (len(snap_list) >= 25):  
                
                snap_date_time = snap_list[0][:-4]  # [:-4] to strip '.jpg'
                
                # if jpeg is in the past, delete it
                if snap_date_time < date + time_: 
                    logger.log('service_snap() - delete %s/%s.jpg' % (tmp_snap_dir, snap_date_time), 'DEBUG')
                    if snap_date_time != 'last':                        
                        os.remove('%s/%s.jpg' % (tmp_snap_dir, snap_date_time))
                        feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                        if os.path.isfile(feed_www_jpg):
                            os.remove(feed_www_jpg)
                
                        # need date time update here in case 00:00 crossed
                        date, time_ = self.current_date_time()
                        snap_dir = '%s/%s/%02i/snap' % (self.images_dbase_dir, date, self.feed)
                    
                        # make sure 'snap_dir' exists, try in case motion creates dir
                        if not os.path.isdir(snap_dir):
                            os.makedirs(snap_dir)
                    
                # if jpeg is now, move it
                elif snap_date_time == date + time_:  
                    logger.log('service_snap() - move %s/%s.jpg %s/%s.jpg' % (tmp_snap_dir, snap_date_time, snap_dir, time_), 'DEBUG')  
                    os.popen3('mv %s/%s.jpg %s/%s.jpg' % (tmp_snap_dir, snap_date_time, snap_dir, time_))
                    feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                    if os.path.isfile(feed_www_jpg):
                        os.remove(feed_www_jpg)
                    self.inc_date_time(self.feed_snap_interval)
                snap_list = snap_list[1:] 
        
        
    def update_fps_journal(self, date, feed, time_, fps):
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
        smovie_fps_journal = '%s/%s/%02i/fps_journal' % (self.images_dbase_dir, date, feed)
      
        with open(smovie_fps_journal, 'a') as f_obj:
            f_obj.write('$%s#%s\n' % (time_, fps))
        
        
    def update_title(self, date, feed, name):
        """ 
        Given the date and feed number updates 'title'
        
        args    : date ...   date 
                  feed ...   feed 
                  name ...   name
        excepts : 
        return  : none
        """
        
        # updates 'name' with name string
        title = '%s/%s/%02i/title' % (self.images_dbase_dir, date, feed)
      
        with open(title, 'w') as f_obj:
            f_obj.write(name)
        
        
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
            
    def call_signal_term(self):
        """
        Updates journals with #HHMMSS$0 signifying no more snaps
        
        args    : 
        excepts : 
        return  : none
        """
        
        if self.feed_enabled:
            date, time_ = self.current_date_time()
            self.update_snap_journal(date, self.feed, False, time_, 0)
    
            
    def call_signal_hup(self):
        """
        Sets the 'self.reload_flag'
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.reload_flag = True
          
        
class Kmotion_Hkd2:
    
    def __init__(self, kmotion_dir):
        
        signal.signal(signal.SIGHUP, self.signal_hup)
        signal.signal(signal.SIGTERM, self.signal_term)
        self.kmotion_dir = kmotion_dir
        self.instance_list = []  # list of 16 Hkd2_Feed instances
        self.keep_running = True  # exit control
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.max_feed = parser.getint('misc', 'max_feed')
        
        for feed in range(1, self.max_feed):
            self.instance_list.append(Hkd2_Feed(self.kmotion_dir, feed))
        
        
    def main(self):
        """
        Start the hkd2 daemon. This daemon wakes up every 2 seconds
        
        args    :
        excepts : 
        return  : none
        """
        
        logger.log('starting daemon ...', 'CRIT')
        
        
        
            
        # self.keep_running, a workaround for exit without exception
        while self.keep_running:
            for inst in self.instance_list:
                inst.service_snap()
                
            time.sleep(2)


    def signal_hup(self, signum, frame):
        """ 
        SIGHUP
        
        args    : discarded
        excepts : 
        return  : none
        """
        logger.log('signal SIGHUP detected, re-reading config file', 'CRIT')
        for inst in self.instance_list:
            inst.call_signal_hup()
 
 
    def signal_term(self, signum, frame):
        """ 
        SIGTERM
        
        args    : discarded
        excepts : 
        return  : none
        """
        
        logger.log('signal_term() - signal SIGTERM detected, updating journals', 'DEBUG')
        for inst in self.instance_list:
            inst.call_signal_term()
        self.keep_running = False
 
    
    
# it is CRUCIAL that this code is bombproof

while True:
    try:    
        Kmotion_Hkd2().main()
        break  # if normal exit, exit the loop
    except:  # global exception catch
        exc_type, exc_value, exc_traceback = sys.exc_info()
        exc_trace = traceback.extract_tb(exc_traceback)[-1]
        exc_loc1 = '%s' % exc_trace[0]
        exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
        
        logger.log('** CRITICAL ERROR ** kmotion_hkd2 crash - type: %s' 
                   % exc_type, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd2 crash - value: %s' 
                   % exc_value, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd2 crash - traceback: %s' 
                   % exc_loc1, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd2 crash - traceback: %s' 
                   % exc_loc2, 'CRIT')
        time.sleep(60)
                   
