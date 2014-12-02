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
Update the 'logs' file with events and check for any incorrect shutdowns. If 
found add an incorrect shutdown warning to the 'logs' file. Implement a mutex
lock to avoid process clashes.

The 'logs' file has the format: $date#time#text$date ... 
"""

import os, time, ConfigParser
import logger, mutex

log_level = 'WARNING'
logger = logger.Logger('update_logs', log_level)


def add_startup_event():
    """ 
    Add a startup event to the 'logs' file. If the previous event was not a
    shutdown event insert an incorrect shutdown warning into the 'logs' file.
    
    Calculate the date and time of the incorrect shutdown by looking for 
    the last jpeg written.
    
    args    : 
    excepts : 
    return  : none
    """
    
    logger.log('add_startup_event() - adding startup event', 'DEBUG')
    kmotion_dir = os.getcwd()[:-5]
    
    # if last event did not include 'shutting down' text, either the first 
    # run or a power fail crashed the system
    try:
        mutex.acquire(kmotion_dir, 'logs')   
        
        log_file = '%s/www/logs' % kmotion_dir
        if not os.path.isfile(log_file):
            f_obj = open(log_file, 'w')
            f_obj.write(time.strftime('$%d/%m/%Y#%H:%M:%S#Initial kmotion startup'))
            f_obj.close()
        
        f_obj = open(log_file, 'r+')
        dblob = f_obj.read()
        f_obj.close()
    finally:
        mutex.release(kmotion_dir, 'logs')
        
    events = dblob.split('$')
    
    error_flag = False
    for i in range(len(events) - 1, -1, -1):
        
        if events[i].find('shutting down') == -1:
            error_flag = False
            break
        
        if events[i].find('Initial') == -1 or events[i].find('starting up') == -1:
            error_flag = True
            break
      
    if error_flag: 
            
        logger.log('add_startup_event() - missing \'shutting down\' event - Incorrect shutdown', 'DEBUG')
            
        # so first we need the ramdisk location
        try:
            mutex.acquire(kmotion_dir, 'kmotion_rc') 
            parser = ConfigParser.SafeConfigParser()
            parser.read('../kmotion_rc')
        finally:
            mutex.release(kmotion_dir, 'kmotion_rc')
        
	ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
	max_feed = int(parser.get('misc', 'max_feed'))
        # so we can scan for the latest jpeg files to get the latest times
        latests = []
        for feed in range(1, max_feed):
            jpegs = os.listdir('%s/%02i' % (ramdisk_dir, feed))
            
            if len(jpegs) > 1: # ie we have some jpegs
                jpegs.sort()
                latests.append(jpegs[-2][:-4]) # skip 'latest_jpeg' file
            
        # get the latest filename, calculate its time and date and construct an 
        # event string
        latests.sort()
        if len(latests) > 0: # as long as a feed has run at some time !      
            latest = latests[-1]
            year =   latest[:4]
            month =  latest[4:6]
            day =    latest[6:8]
            hour =   latest[8:10]
            min_ =   latest[10:12]
            sec =    latest[12:]
            new_event = '$%s/%s/%s#%s:%s:%s#Incorrect shutdown / Mains failure' % (day, month, year, hour, min_, sec)
            add_event(new_event)
    
    # in all cases add a starting up message
    add_event(time.strftime('$%d/%m/%Y#%H:%M:%S#kmotion starting up'))
    
    
def add_shutdown_event():
    """ 
    Add a shutdown event to the 'logs' file
    
    args    : 
    excepts : 
    return  : none
    """
    
    logger.log('add_shutdown_event() - adding shutdown event', 'DEBUG')
    add_event(time.strftime('$%d/%m/%Y#%H:%M:%S#kmotion shutting down'))
              
    
def add_deletion_event(date):
    """ 
    Add a deletion event to the 'logs' file
    
    args    : date ... archive file date string in the formay YYYYMMDD
    excepts : 
    return  : none
    """
    
    logger.log('add_deletion_event() - adding deletion event', 'DEBUG')
    year =   date[:4]
    month =  date[4:6]
    day =    date[6:8]
    add_event('$%s#Deleting archive data for %s/%s/%s' % (time.strftime('%d/%m/%Y#%H:%M:%S'), day, month, year))
        
    
def add_no_space_event():
    """ 
    Add a no space event to the 'logs' file
    
    args    : 
    excepts : 
    return  : none
    """
    
    logger.log('add_no_space_event() - adding deletion event', 'DEBUG')
    add_event('$%s#Deleting todays data, \'images_dbase\' is too small' % time.strftime('%d/%m/%Y#%H:%M:%S'))
    
    
def add_event(new_event):
    """ 
    Add an event to the beginning of the 'logs' file
    
    args    : new_event ... the string to add
    excepts : 
    return  : none
    """
    
    kmotion_dir = os.getcwd()[:-5]
    try:
        mutex.acquire(kmotion_dir, 'logs')
        f_obj = open('%s/www/logs' % kmotion_dir, 'r+')
        dblob = f_obj.read()
        events = dblob.split('$')
        if len(events) > 500: # truncate logs
            events.pop()
        events = '$'.join(events)
        f_obj.seek(0)
        f_obj.write(new_event)
        f_obj.writelines(events)
        f_obj.truncate() # adj to new file length
        f_obj.close()
    finally:
        mutex.release(kmotion_dir, 'logs')
    
        
if __name__ == '__main__':
    add_deletion_event('20092020')
    
    