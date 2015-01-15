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
Update the 'logs' file with events and check for any incorrect shutdowns. If 
found add an incorrect shutdown warning to the 'logs' file. Implement a mutex
lock to avoid process clashes.

The 'logs' file has the format: $date#time#text$date ... 
"""

import os, time
import logger
from mutex_parsers import *
from mutex import Mutex

class WWWLog:
    

    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.log_file = '%s/www/logs' % self.kmotion_dir
        kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.logger = logger.Logger('init_motion', WWWLog.log_level)
        self.ramdisk_dir = kmotion_parser.get('dirs', 'ramdisk_dir')
        self.max_feed = kmotion_parser.getint('misc', 'max_feed')
                
        if not os.path.isfile(self.log_file):
            with open(self.log_file, 'w') as f_obj:
                f_obj.write(time.strftime('%d/%m/%Y#%H:%M:%S#Initial kmotion startup'))
        
        


    def add_startup_event(self):
        """ 
        Add a startup event to the 'logs' file. If the previous event was not a
        shutdown event insert an incorrect shutdown warning into the 'logs' file.
        
        Calculate the date and time of the incorrect shutdown by looking for 
        the last jpeg written.
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('add_startup_event() - adding startup event', 'DEBUG')       
        
        # if last event did not include 'shutting down' text, either the first 
        # run or a power fail crashed the system

        
        
        error_flag = False
        
        with open(self.log_file, 'r') as f_obj:
            events = f_obj.read().split('$')
            
        for i in range(len(events) - 1, -1, -1):
            
            if events[i].find('shutting down') == -1:
                error_flag = False
                break
            
            if events[i].find('Initial') == -1 or events[i].find('starting up') == -1:
                error_flag = True
                break
          
        if error_flag: 
                
            self.logger.log('add_startup_event() - missing \'shutting down\' event - Incorrect shutdown', 'DEBUG')
            
            # so we can scan for the latest jpeg files to get the latest times
            latests = []
            for feed in range(1, self.max_feed):
                jpegs = os.listdir('%s/%02i' % (self.ramdisk_dir, feed))
            
                if len(jpegs) > 1:  # ie we have some jpegs
                    jpegs.sort()
                    latests.append(jpegs[-2][:-4])  # skip 'latest_jpeg' file
          
            
                    
            # get the latest filename, calculate its time and date and construct an 
            # event string
            latests.sort()
            if len(latests) > 0:  # as long as a feed has run at some time !      
                latest = latests[-1]
                year = latest[:4]
                month = latest[4:6]
                day = latest[6:8]
                hour = latest[8:10]
                min_ = latest[10:12]
                sec = latest[12:]
                new_event = '%s/%s/%s#%s:%s:%s#Incorrect shutdown / Mains failure' % (day, month, year, hour, min_, sec)
                self.add_event(new_event)
        
        # in all cases add a starting up message
        self.add_event(time.strftime('%d/%m/%Y#%H:%M:%S#kmotion starting up'))
    
    
    def add_shutdown_event(self):
        """ 
        Add a shutdown event to the 'logs' file
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('add_shutdown_event() - adding shutdown event', 'DEBUG')
        self.add_event(time.strftime('%d/%m/%Y#%H:%M:%S#kmotion shutting down'))
              
    
    def add_deletion_event(self, date):
        """ 
        Add a deletion event to the 'logs' file
        
        args    : date ... archive file date string in the formay YYYYMMDD
        excepts : 
        return  : none
        """
        
        self.logger.log('add_deletion_event() - adding deletion event', 'DEBUG')
        year = date[:4]
        month = date[4:6]
        day = date[6:8]
        self.add_event('%s#Deleting archive data for %s/%s/%s' % (time.strftime('%d/%m/%Y#%H:%M:%S'), day, month, year))
        
    
    def add_no_space_event(self):
        """ 
        Add a no space event to the 'logs' file
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('add_no_space_event() - adding deletion event', 'DEBUG')
        self.add_event('%s#Deleting todays data, \'images_dbase\' is too small' % time.strftime('%d/%m/%Y#%H:%M:%S'))
    
    
    def add_event(self, new_event):
        """ 
        Add an event to the beginning of the 'logs' file
        
        args    : new_event ... the string to add
        excepts : 
        return  : none
        """
        try:
            mutex = Mutex(self.kmotion_dir, 'logs')
            mutex.acquire()
            with open(self.log_file, 'r+') as f_obj:
                events = f_obj.read().split('$')
                if len(events) > 500:  # truncate logs
                    events.pop()
                events = '$' + new_event + '$'.join(events)
                f_obj.seek(0)
                f_obj.write(events)
                f_obj.truncate()
        finally:
            mutex.release()
    
        
if __name__ == '__main__':
    print '\nModule self test ...\n'
    kmotion_dir = os.path.abspath('..')
    
    
    WWWLog(kmotion_dir).add_no_space_event()
    
    
    
