#!/usr/bin/env python

"""
Checks the size of the images directory deleteing the oldest directorys first 
when 90% of max_size_gb is reached. Responds to a SIGHUP by re-reading its 
configuration. Checks the current kmotion software version every 24 hours.
"""

import os, sys, urllib, time, signal, shutil, ConfigParser, traceback
import logger
from mutex_parsers import *
from www_logs import WWWLog
from multiprocessing import Process
import subprocess

class Kmotion_Hkd1(Process):
    
    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.log = logger.Logger('hkd1', logger.DEBUG)
        self.images_dbase_dir = ''  # the 'root' directory of the images dbase
        self.kmotion_dir = kmotion_dir
        self.max_size_gb = 0  # max size permitted for the images dbase
        self.version = ''  # the current kmotion software version
        self.www_logs = WWWLog(self.kmotion_dir) 
        
    def read_config(self):
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        
        try:  # try - except because kmotion_rc is a user changeable file
            self.version = parser.get('version', 'string')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
            self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
            # 2**30 = 1GB
            self.max_size_gb = parser.getint('storage', 'images_dbase_limit_gb') * 2 ** 30
            
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            self.log('** CRITICAL ERROR ** corrupt \'kmotion_rc\': %s' % 
                       sys.exc_info()[1], logger.CRIT)
            self.log('** CRITICAL ERROR ** killing all daemons and terminating', logger.CRIT)
            # sys.exit()
        
        www_parser = mutex_www_parser_rd(self.kmotion_dir)
        self.feed_list = []
        for section in www_parser.sections():
            try:
                if 'motion_feed' in section:                    
                    if www_parser.getboolean(section, 'feed_enabled'):
                        feed = int(section.replace('motion_feed', ''))
                        self.feed_list.append(feed)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                self.log('init - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}), logger.DEBUG)
        
    def run(self):
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes
        
        args    : 
        excepts : 
        return  : none
        """
        while True:
            try:
                self.read_config()
                self.log('starting daemon ...', logger.CRIT) 
                self.www_logs.add_startup_event()
                
                while True:   
                    # sleep here to allow system to settle 
                    time.sleep(15 * 60)
        
                    # if > 90% of max_size_gb, delete oldest
                    if  self.images_dbase_size() > self.max_size_gb * 0.9:
                        
                        dir_ = os.listdir(self.images_dbase_dir)
                        dir_.sort()
                            
                        # if need to delete current recording, shut down kmotion 
                        if time.strftime('%Y%m%d') == dir_[0]:
                            self.log('** CRITICAL ERROR ** crash - image storage limit reached ... need to', logger.CRIT)
                            self.log('** CRITICAL ERROR ** crash - delete todays data, \'images_dbase\' is too small', logger.CRIT)
                            self.log('** CRITICAL ERROR ** crash - SHUTTING DOWN KMOTION !!', logger.CRIT)
                            self.www_logs.add_no_space_event()
                        
                        self.www_logs.add_deletion_event(dir_[0])
                        self.log('image storeage limit reached - deleteing %s/%s' % 
                                   (self.images_dbase_dir, dir_[0]), logger.CRIT)
                        shutil.rmtree(os.path.join(self.images_dbase_dir, dir_[0])) 
                        

            except:  # global exception catch        
                exc_type, exc_value, exc_tb = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_tb)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                self.log('** CRITICAL ERROR ** crash - type: %s' % exc_type, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - value: %s' % exc_value, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc1, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc2, logger.CRIT) 
                del(exc_tb)
                time.sleep(60)
                
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
                with open('%s/dir_size' % date_dir) as f_obj:
                    bytes_ += int(f_obj.readline())
    
        self.log('images_dbase_size() - size : %s' % bytes_, logger.DEBUG)
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
        
            self.log('update_dbase_sizes() - size : %s' % bytes_, logger.DEBUG)
            
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
        line = subprocess.Popen('nice -n 19 du -s %s' % dir_, shell=True, stdout=subprocess.PIPE).communicate()[0]
        
        bytes_ = int(line.split()[0]) * 1000
        self.log('size of %s = %s' % (dir_, bytes_), logger.DEBUG)
        return bytes_

    
    
        
    
    
