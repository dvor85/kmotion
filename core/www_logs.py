#!/usr/bin/env python

"""
Update the 'logs' file with events and check for any incorrect shutdowns. If 
found add an incorrect shutdown warning to the 'logs' file. Implement a mutex
lock to avoid process clashes.

The 'logs' file has the format: $date#time#text$date ... 
"""

import os, time
import logger
from mutex import Mutex

log = logger.Logger('www_logs', logger.Logger.DEBUG)

class WWWLog:
    
    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.log_file = '%s/www/logs' % self.kmotion_dir
                
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
        
        log.d('add_startup_event() - adding startup event')       
        
        # if last event did not include 'shutting down' text, either the first 
        # run or a power fail crashed the system

        
        
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
                
            log.d('add_startup_event() - missing \'shutting down\' event - Incorrect shutdown')
            
        # in all cases add a starting up message
        self.add_event(time.strftime('%d/%m/%Y#%H:%M:%S#kmotion starting up'))
    
    
    def add_shutdown_event(self):
        """ 
        Add a shutdown event to the 'logs' file
        
        args    : 
        excepts : 
        return  : none
        """
        
        log.d('add_shutdown_event() - adding shutdown event')
        self.add_event(time.strftime('%d/%m/%Y#%H:%M:%S#kmotion shutting down'))
              
    
    def add_deletion_event(self, date):
        """ 
        Add a deletion event to the 'logs' file
        
        args    : date ... archive file date string in the formay YYYYMMDD
        excepts : 
        return  : none
        """
        
        log.d('add_deletion_event() - adding deletion event')
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
        
        log.d('add_no_space_event() - adding deletion event')
        self.add_event('%s#Deleting todays data, \'images_dbase\' is too small' % time.strftime('%d/%m/%Y#%H:%M:%S'))
    
    
    def add_event(self, new_event):
        """ 
        Add an event to the beginning of the 'logs' file
        
        args    : new_event ... the string to add
        excepts : 
        return  : none
        """
        mutex = Mutex(self.kmotion_dir, 'logs')
        mutex.acquire()
        try:
            with open(self.log_file, 'r+') as f_obj:
                events = f_obj.read().splitlines()
                events.append(new_event)
                if len(events) > 500:  # truncate logs
                    events = events[-500:]
                f_obj.seek(0)
                f_obj.write('\n'.join(events))
                f_obj.truncate()
        finally:
            mutex.release()
    
        
if __name__ == '__main__':
    print '\nModule self test ...\n'
    kmotion_dir = os.path.abspath('..')
    
    
    WWWLog(kmotion_dir).add_no_space_event()
    
    
    
