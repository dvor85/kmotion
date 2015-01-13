#!/usr/bin/env python
# This file is part of kmotion.
# kmotion is free software: you can redistribute it and/or modify
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# kmotion is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# You should have received a copy of the GNU General Public License
# along with kmotion.  If not, see <http://www.gnu.org/licenses/>.

"""
Checks the size of the images directory deleteing the oldest directorys first 
when 90% of max_size_gb is reached. Responds to a SIGHUP by re-reading its 
configuration. Checks the current kmotion software version every 24 hours.
"""
import threading
from threading import Thread
from core.www_logs import WWWLog
import ConfigParser
import os, sys, time, shutil, traceback

import logger




class Kmotion_Hkd1(Thread):
    
    log_level = 'DEBUG'
    
    def __init__(self, settings):
        Thread.__init__(self)
        self.logger = logger.Logger('kmotion_hkd1', Kmotion_Hkd1.log_level)
        self.setName('kmotion_hkd1')
        self.settings = settings
        self.kmotion_dir = self.settings.get('DEFAULT', 'kmotion_dir')
        self.running = False
        self.www_log = WWWLog(self.settings)
        self.read_config()
        self.running = True 
        self.start()
        
        
    def sleep(self, seconds):
        while seconds>0 and self.running:
            time.sleep(1)
            seconds-=1
            
            
        
    def run(self):
           
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes
        
        args    : 
        excepts : 
        return  : none
        """
        # it is CRUCIAL that this code is bombproof
        self.logger.log('starting daemon ...', 'CRIT') 
        while self.running:
            self.www_log.add_startup_event()
            try:    
                while self.running: 
                    # sleep here to allow system to settle 
                    print 'waiting...'
                    self.sleep(15 * 60)
                    date = time.strftime('%Y%m%d', time.localtime(time.time()))
         
                    # if > 90% of max_size_gb, delete oldest
                    if  self.images_dbase_size() > self.max_size_gb * 0.9:
                         
                        dir_ = os.listdir(self.images_dbase_dir)
                        dir_.sort()
                         
                        # if need to delete current recording, shut down kmotion 
                        if date == dir_[0]:
                            self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - image storage limit reached ... need to', 'CRIT')
                            self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - delete todays data, \'images_dbase\' is too small', 'CRIT')
                            self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - SHUTTING DOWN KMOTION !!', 'CRIT')
                            self.www_log.add_no_space_event()
                            #self.daemonControl.kill_daemons()
                            self.stop()
                         
                        self.www_log.add_deletion_event(dir_[0])
                        self.logger.log('image storage limit reached - deleteing %s/%s' % 
                                   (self.images_dbase_dir, dir_[0]), 'CRIT')
                        shutil.rmtree('%s/%s' % (self.images_dbase_dir, dir_[0])) 
                        
            except: # global exception catch        
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - type: %s' 
                           % exc_type, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - value: %s' 
                           % exc_value, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - traceback: %s' 
                           %exc_loc1, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - traceback: %s' 
                           %exc_loc2, 'CRIT')
                self.sleep(60)
                self.logger.log('starting daemon ...', 'CRIT') 
                self.sleep(60) # delay to let stack settle else 'update_version' returns 
                
        
                
    
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
            date_dir = '%s/%s' % (self.images_dbase_dir, date)
            if os.path.isfile('%s/dir_size' % date_dir):
                
                with open('%s/dir_size' % date_dir) as f_obj:
                    bytes_ += int(f_obj.readline())
    
        self.logger.log('images_dbase_size() - size : %s' % bytes_, 'DEBUG')
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
            date_dir = '%s/%s' % (self.images_dbase_dir, date)
            
            # skip update if 'dir_size' exists or 'date' == 'today'
            if os.path.isfile('%s/dir_size' % date_dir) and date != time.strftime('%Y%m%d'):
                continue

            bytes_ = 0
            feeds = os.listdir(date_dir)
            feeds.sort()

            for feed in feeds:
                feed_dir = '%s/%s' % (date_dir, feed)
                
                # motion daemon may not have created all needed dirs, so only check
                # the ones that have been created
                if os.path.isdir('%s/movie' % feed_dir):
                    bytes_ += self.size_movie(feed_dir)
                
                if os.path.isdir('%s/snap' % feed_dir):
                    bytes_ += self.size_snap(feed_dir) 
        
            self.logger.log('update_dbase_sizes() - size : %s' % bytes_, 'DEBUG')
            
            with open('%s/dir_size' % date_dir, 'w') as f_obj:
                f_obj.write(str(bytes_))
        
        
    def size_movie(self, feed_dir):
        """
        Returns the size of feed_dir/movie dir in bytes. There will not be as 
        many files here as in the snap or smovie dirs
        
        args    : feed_dir ... the full path to the feed dir
        excepts : 
        return  : int ...      the size of feed_dir/movie dir in bytes
        """
        
        # don't use os.path.getsize as it does not report disk useage
        with os.popen('nice -n 19 du -s %s/movie' % feed_dir) as f_obj:
            line = f_obj.readline()
        
        bytes_ = int(line.split()[0]) * 1000
        self.logger.log('size_movie() - %s size : %s' % (feed_dir, bytes_), 'DEBUG')
        return bytes_

    
    
    def size_snap(self, feed_dir):
        """
        Returns the size of feed_dir/snap dir in bytes. An average size for 
        each of 8 time zones is calculated and a fast file head count is then 
        used for each time zone.
        
        args    : feed_dir ... the full path to the feed dir
        excepts : 
        return  : int ...      the size of feed_dir/snap dir in bytes
        """
    
        tzone_jpegs = [[], [], [], [], [], [], [], []]
        jpegs = os.listdir('%s/snap' % feed_dir)
        jpegs.sort()
        
        for jpeg in jpegs:
            if jpeg >= '000000' and jpeg < '030000':
                tzone_jpegs[0].append(jpeg) 
            elif jpeg >= '030000' and jpeg < '060000':
                tzone_jpegs[1].append(jpeg) 
            elif jpeg >= '060000' and jpeg < '090000':
                tzone_jpegs[2].append(jpeg) 
            elif jpeg >= '090000' and jpeg < '120000':
                tzone_jpegs[3].append(jpeg) 
            elif jpeg >= '120000' and jpeg < '150000':
                tzone_jpegs[4].append(jpeg) 
            elif jpeg >= '150000' and jpeg < '180000':
                tzone_jpegs[5].append(jpeg) 
            elif jpeg >= '180000' and jpeg < '210000':
                tzone_jpegs[6].append(jpeg) 
            elif jpeg >= '210000' and jpeg <= '235959':
                tzone_jpegs[7].append(jpeg) 
    
        total_size = 0
        
        for tzone in range(8):
            num_jpegs = len(tzone_jpegs[tzone])
            
            if num_jpegs == 0:
                continue

            sample = min(num_jpegs, 30) # sample max 30 jpegs
            total_bytes = 0
            
            for i in range(sample): 
                jpeg = tzone_jpegs[tzone][i]
                
                # don't use os.path.getsize as it does not report disk useage
                with os.popen('nice -n 19 du -s %s/snap/%s' % (feed_dir, jpeg)) as f_obj:
                    line = f_obj.readline()
                total_bytes += int(line.split()[0]) * 1000
                
            total_size += num_jpegs * (total_bytes / sample)
        
        self.logger.log('size_snap() - %s size : %s' % (feed_dir, total_size), 'DEBUG')
        return total_size
        
    
    def read_config(self):
        """ 
        Read self.images_dbase_dir and self.max_size_gb from kmotion_rc and
        self.version from kmotion_rc. If kmotion_rc is corrupt logs error and exits
        
        args    :
        excepts : 
        return  : none
        """
        
        try: # try - except because kmotion_rc is a user changeable file
            self.version = self.settings.get('DEFAULT', 'version')
            self.images_dbase_dir = self.settings.get('DEFAULT', 'images_dbase_dir')
            # 2**30 = 1GB
            self.max_size_gb = self.settings.getint('DEFAULT', 'images_dbase_limit_gb') * 2**30
            
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            self.logger.log('** CRITICAL ERROR ** corrupt \'kmotion_rc\': %s' % 
                       sys.exc_info()[1], 'CRIT')
            self.logger.log('** CRITICAL ERROR ** killing all daemons and terminating', 'CRIT')
            #self.daemonControl.kill_daemons()
            
    def stop(self):
        self.running = False  
        self.logger.log('stopping daemon ...', 'CRIT')
        
    
    
    
if __name__ == '__main__':    
    print '\nModule self test ...\n'
    kmotion_dir = os.path.abspath('..')
    settings = ConfigParser.SafeConfigParser()
    settings.read(os.path.join(kmotion_dir,'settings.cfg'))
    settings.set('DEFAULT', 'kmotion_dir', kmotion_dir)
    print 'My PID is:', os.getpid()
   
    hkd1=Kmotion_Hkd1(settings)    

    running = True
    while running:
        running = False
        for t in threading.enumerate():
            if t != threading.currentThread():
                running = running or t.is_alive()
    print 'end hkd1'
    



    
