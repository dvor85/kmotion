#!/usr/bin/env python
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

import threading
from threading import Thread
from core.www_logs import WWWLog
import ConfigParser
import os, sys, time, shutil, traceback
import logger


log_level = 'DEBUG'

class Hkd2_Feed:
    
    def __init__(self, settings, feed):
        self.logger = logger.Logger('kmotion_hkd2', log_level)
        self.feed = feed                 
        self.epoch_time = time.time()  # secs since epoch 
        self.settings = settings
        try:  # try - except because kmotion_rc is user changeable file
            self.kmotion_dir = self.settings.get('DEFAULT', 'kmotion_dir')
            self.images_dbase_dir = self.settings.get('DEFAULT', 'images_dbase_dir')
            self.ramdisk_dir = self.settings.get('DEFAULT', 'ramdisk_dir')
            
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError): 
            self.logger.log('** CRITICAL ERROR ** corrupt \'settings.cfg\': %s' % 
                       sys.exc_info()[1], 'CRIT')
            self.logger.log('** CRITICAL ERROR ** killing all daemons and terminating', 'CRIT')
            
        self.www_log = WWWLog(self.settings)
        self.read_config()
        
        
    def read_config(self):
        """
        Read configs from kmotion_rc, kmotion_rc and www_rc.
        
        args    :
        excepts : 
        return  : none
        """    
        self.feed_enabled = self.settings.getboolean(self.feed, 'feed_enabled')
        self.feed_snap_enabled = self.settings.getboolean(self.feed, 'feed_snap_enabled')
        self.feed_snap_interval = self.settings.getint(self.feed, 'feed_snap_interval')
        self.feed_name = self.settings.get(self.feed, 'feed_name')
        
    
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
         
#         if self.reload_flag:  # if 'self.reload_flag', reload the config
#             self.reload_flag = False
#             
#             old_feed_enabled = self.feed_enabled
#             old_snap_enabled = self.feed_snap_enabled
#             self.read_config()
#             
#             # if feed or snap just enabled, update 'epoch_time'
#             if (not old_feed_enabled and self.feed_enabled) or (not old_snap_enabled and self.feed_snap_enabled):
#                 self.epoch_time = time.time()
#                 date, time_ = self.current_date_time()
                        
            # if feed enabled or just disabled, update journals
        if self.feed_enabled:
                
            feed_dir = '%s/%s/%s' % (self.images_dbase_dir, date, self.feed)
            if not os.path.isdir(feed_dir):
                os.makedirs(feed_dir)
            
            # update smovie fps journals                
            self.update_title(date)
            
            tmp_snap_dir = '%s/%s' % (self.ramdisk_dir, self.feed) 
            snap_list = list(os.listdir(tmp_snap_dir))
            snap_list.sort()
            
            
            # need this > 25 buffer to ensure kmotion can view jpegs before we 
            # move or delete them
            while (len(snap_list) >= 25):  
                
                snap_date_time = snap_list.pop(0)[:-4]  # [:-4] to strip '.jpg'
                
                # if jpeg is in the past, delete it
                if snap_date_time < date + time_: 
                    self.logger.log('service_snap() - delete %s/%s.jpg' % (tmp_snap_dir, snap_date_time), 'DEBUG')
                    if snap_date_time != 'last':                        
                        os.remove('%s/%s.jpg' % (tmp_snap_dir, snap_date_time))
                        feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                        if os.path.isfile(feed_www_jpg):
                            os.remove(feed_www_jpg)
                
                        
                    
                # if jpeg is now, move it
                elif snap_date_time == date + time_:  
                    if self.feed_snap_enabled:
                        # need date time update here in case 00:00 crossed
                        date, time_ = self.current_date_time()
                        snap_dir = '%s/%s/%s/snap' % (self.images_dbase_dir, date, self.feed)
                    
                        # make sure 'snap_dir' exists, try in case motion creates dir
                        if not os.path.isdir(snap_dir):
                            os.makedirs(snap_dir)
                            
                        self.logger.log('service_snap() - move %s/%s.jpg %s/%s.jpg' % (tmp_snap_dir, snap_date_time, snap_dir, time_), 'DEBUG')  
                        os.popen3('mv %s/%s.jpg %s/%s.jpg' % (tmp_snap_dir, snap_date_time, snap_dir, time_))
                        feed_www_jpg = '%s/www/%s.jpg' % (tmp_snap_dir, snap_date_time)
                        if os.path.isfile(feed_www_jpg):
                            os.remove(feed_www_jpg)
                        self.inc_date_time(self.feed_snap_interval)
        
        
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
        title = '%s/%s/%s/title' % (self.images_dbase_dir, date, self.feed)
      
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
            
    
            
class Kmotion_Hkd2(Thread):
    
    def __init__(self, settings):
        Thread.__init__(self)
        self.logger = logger.Logger('kmotion_hkd2', log_level)
        self.setName('kmotion_hkd2')
        self.settings = settings
        self.kmotion_dir = self.settings.get('DEFAULT', 'kmotion_dir')
        self.ramdisk_dir = self.settings.get('DEFAULT', 'ramdisk_dir')
        self.running = False
        self.www_log = WWWLog(self.settings)
        self.instance_list = []  # list of Hkd2_Feed instances
        for feed in self.settings.sections():
            self.instance_list.append(Hkd2_Feed(self.settings, feed))
        
        self.running = True 
        self.start()
        
    def sleep(self, seconds):
        while seconds>0 and self.running:
            time.sleep(1)
            seconds-=1    
        
    def run(self):
        """
        Start the hkd2 daemon. This daemon wakes up every 2 seconds
        
        args    :
        excepts : 
        return  : none
        """
        
        self.logger.log('starting daemon ...', 'CRIT')
        
        
        
            
        # self.keep_running, a workaround for exit without exception
        while self.running:
            for inst in self.instance_list:
                inst.service_snap()
                
            self.sleep(2)

    def stop(self):
        self.logger.log('stopping daemon ...', 'CRIT')
        self.running = False  
    

if __name__ == '__main__':    
    print '\nModule self test ...\n'
    kmotion_dir = os.path.abspath('..')
    settings = ConfigParser.SafeConfigParser()
    settings.read(os.path.join(kmotion_dir, 'settings.cfg'))
    settings.set('DEFAULT', 'kmotion_dir', kmotion_dir)
    print 'My PID is:', os.getpid()
   
    hkd2 = Kmotion_Hkd2(settings)    

    running = True
    while running:
        running = False
        for t in threading.enumerate():
            if t != threading.currentThread():
                running = running or t.is_alive()
        time.sleep(1)
    print 'end hkd2'
                   
