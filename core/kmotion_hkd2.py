#!/usr/bin/env python


"""
Copys, moves or deletes files 
"""

import os, sys, time, signal, shutil, traceback
from datetime import datetime
import logger
from mutex_parsers import *
from threading import Thread, Semaphore, Lock
from multiprocessing import Process


log = logger.Logger('hkd2', logger.WARNING)


class Hkd2_Feed():
    
    def __init__(self, kmotion_dir, feed, semaphore):
        self.kmotion_dir = kmotion_dir  # the 'root' directory of kmotion
        self.feed = int(feed)  # the feed number
        self.ramdisk_dir = ''  # the 'root' dir of the ramdisk
        self.images_dbase_dir = ''  # the 'root' dir of the images dbase
        self.feed_snap_enabled = True  # feed snap enabled
        self.feed_snap_interval = ''  # snap interval in seconds
        self.feed_fps = ''  # frame fps
        self.feed_name = ''  # feed name
        self.snap_time = time.time() 
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
            log('** CRITICAL ERROR ** corrupt \'kmotion_rc\': %s' % 
                       sys.exc_info()[1], logger.CRIT)
            log('** CRITICAL ERROR ** killing all daemons and terminating', logger.CRIT)
            sys.exit()
            
        parser = mutex_www_parser_rd(self.kmotion_dir) 
        self.feed_snap_enabled = parser.getboolean('motion_feed%02i' % self.feed, 'feed_snap_enabled')
        self.feed_snap_interval = parser.getint('motion_feed%02i' % self.feed, 'feed_snap_interval')
        self.feed_fps = parser.getint('motion_feed%02i' % self.feed, 'feed_fps')
        self.feed_name = parser.get('motion_feed%02i' % self.feed, 'feed_name')
        self.inc_snap_time(self.feed_snap_interval)
        
    
    def main(self):
        """ 
        Copys, moves or deletes files from 'ramdisk_dir/kmotion' to
        'images_dbase_dir/snap' generating a 'sanitized' snap sequence.
        
        args    : 
        excepts : 
        return  : none
        """
        self.semaphore.acquire()
        try:
            self.lock.acquire()
            try:
                jpg_dir = '%s/%02i' % (self.ramdisk_dir, self.feed) 
                jpg_list = os.listdir(jpg_dir)
                jpg_list.sort()
                
                self.update_title()
                
                # need this > 10 buffer to ensure kmotion can view jpegs before we 
                # move or delete them
                while (len(jpg_list) >= 10):  
                    jpg = jpg_list.pop(0)
                    jpg_time = os.path.getmtime(os.path.join(jpg_dir, jpg))
                    
                    if jpg != 'last.jpg':
                        p = {'src':os.path.join(jpg_dir, jpg),
                             'dst':os.path.join(self.images_dbase_dir, 
                                                datetime.fromtimestamp(jpg_time).strftime('%Y%m%d'), 
                                                '%02i' % self.feed,
                                                'snap', 
                                                '%s.jpg' % datetime.fromtimestamp(jpg_time).strftime('%H%M%S'))}
                        
                        if self.feed_snap_enabled and self.snap_time <= jpg_time:
                            try:
                                log('service_snap() - copy {src} to {dst}'.format(**p), logger.DEBUG)
                                if not os.path.isdir(os.path.dirname(p['dst'])):
                                    os.makedirs(os.path.dirname(p['dst']))
                                shutil.copy(**p)
                            except:
                                exc_type, exc_value, exc_traceback = sys.exc_info()
                                log('service_snap() - error {type}: {value} while copy jpg to snap dir.'.format(**{'type':exc_type, 'value':exc_value}), logger.CRIT)
                            finally:
                                self.inc_snap_time(self.feed_snap_interval)    
                            
                        log('service_snap() - delete {src}'.format(**p), logger.DEBUG)    
                        os.remove(os.path.join(jpg_dir, jpg))
                        
                        feed_www_jpg = os.path.join(jpg_dir, 'www', jpg)
                        if os.path.isfile(feed_www_jpg):
                            os.remove(feed_www_jpg)
                            
            finally:
                self.lock.release() 
        finally:
            self.semaphore.release()
            
        
    def update_title(self):
        
        # updates 'name' with name string
        title = '%s/%s/%02i/title' % (self.images_dbase_dir, time.strftime('%Y%m%d'), self.feed)
        if not os.path.isdir(os.path.dirname(title)):
            os.makedirs(os.path.dirname(title))
        
        if not os.path.isfile(title):
            with open(title, 'w') as f_obj:
                f_obj.write(self.feed_name)
        
    
    def inc_snap_time(self, inc_sec):
        self.snap_time += inc_sec
        
    
class Kmotion_Hkd2(Process):
    
    
    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.kmotion_dir = kmotion_dir
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        
        www_parser = mutex_www_parser_rd(self.kmotion_dir)
        self.feed_list = []
        for section in www_parser.sections():
            try:
                if 'motion_feed' in section:
                    feed = int(section.replace('motion_feed', ''))
                    if www_parser.getboolean(section, 'feed_enabled'):
                        self.feed_list.append(feed)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                self.log('init - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}), logger.DEBUG)
        self.feed_list.sort()
        
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
                log('starting daemon ...', logger.CRIT)
                self.instance_list = []  # list of Hkd2_Feed instances
                for feed in self.feed_list:
                    self.instance_list.append(Hkd2_Feed(self.kmotion_dir, feed, self.semaphore))
                while True:
                    time.sleep(2)
                    for inst in self.instance_list:
                        Thread(target=inst.main).start()
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                 
                log('** CRITICAL ERROR ** crash - type: %s' 
                           % exc_type, logger.CRIT)
                log('** CRITICAL ERROR ** crash - value: %s' 
                           % exc_value, logger.CRIT)
                log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc1, logger.CRIT)
                log('** CRITICAL ERROR ** crash - traceback: %s' 
                           % exc_loc2, logger.CRIT)
                time.sleep(60)



