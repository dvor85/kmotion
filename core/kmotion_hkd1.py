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
Checks the size of the images directory deleteing the oldest directorys first 
when 90% of max_size_gb is reached. Responds to a SIGHUP by re-reading its 
configuration. Checks the current kmotion software version every 24 hours.
"""

import os, sys, urllib, time, signal, shutil, ConfigParser, traceback
import logger, daemon_whip, sort_rc, update_logs, mutex

log_level = 'WARNING'
logger = logger.Logger('kmotion_hkd1', log_level)

class SigTerm(Exception):
    pass


class Kmotion_Hkd1:
    
    
    def __init__(self):
        
        self.images_dbase_dir = ''    # the 'root' directory of the images dbase
        self.kmotion_dir = ''         # the 'root' directory of kmotion
        self.max_size_gb = 0          # max size permitted for the images dbase
        self.version = ''             # the current kmotion software version
        
        self.read_config()
        signal.signal(signal.SIGHUP, self.signal_hup)
        signal.signal(signal.SIGTERM, self.signal_term)       
        
        
    def main(self):    
        """
        Start the hkd1 daemon. This daemon wakes up every 15 minutes
        
        args    : 
        excepts : 
        return  : none
        """
        
        logger.log('starting daemon ...', 'CRIT') 
        time.sleep(60) # delay to let stack settle else 'update_version' returns 
                       # IOError on system boot  
        old_date = time.strftime('%Y%m%d', time.localtime(time.time()))
        #self.update_version()
        
        while True:   
            
            # sleep here to allow system to settle 
            time.sleep(15 * 60)
            date = time.strftime('%Y%m%d', time.localtime(time.time()))

            # if > 90% of max_size_gb, delete oldest
            if  self.images_dbase_size() > self.max_size_gb * 0.9:
                
                dir_ = os.listdir(self.images_dbase_dir)
                dir_.sort()
                
                if len(dir_) > 0 and dir_[0] == '.svn': 
                    dir_.pop(0)  # skip '.svn' directory
                    
                # if need to delete current recording, shut down kmotion 
                if date == dir_[0]:
                    logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - image storage limit reached ... need to', 'CRIT')
                    logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - delete todays data, \'images_dbase\' is too small', 'CRIT')
                    logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - SHUTTING DOWN KMOTION !!', 'CRIT')
                    update_logs.add_no_space_event()
                    daemon_whip.kill_daemons()
                    sys.exit()
                
                update_logs.add_deletion_event(dir_[0])
                logger.log('image storeage limit reached - deleteing %s/%s' % 
                           (self.images_dbase_dir, dir_[0]), 'CRIT')
                shutil.rmtree('%s/%s' % (self.images_dbase_dir, dir_[0])) 
                
            if date != old_date:
                
                time.sleep(5 * 60) # to ensure journals are written
                logger.log('midnight processes started ...', 'CRIT')
                #self.ping_server_0000()
                #self.update_version()
                self.build_smovie_cache(date)
                old_date = date
                
                
    def update_version(self):
        """        
        Get the latest version string and update 'www_rc' if neccessary.
        
        args    : 
        excepts : 
        return  : none
        """
        
        latest_version = self.get_version()
        logger.log('parsed latest version : \'%s\'' % latest_version, 'CRIT')
        self.set_version(latest_version)
                
                   
    def set_version(self, version):
        """        
        Sets the 'version_latest' in '../www/www_rc'
        
        args    : 
        excepts : 
        return  : str ... the version string
        """
        
        parser = self.mutex_www_parser_rd(self.kmotion_dir)
        parser.set('system', 'version_latest', version)
        self.mutex_www_parser_wr(self.kmotion_dir, parser)
        
        mutex.acquire(self.kmotion_dir, 'www_rc') 
        sort_rc.sort_rc('../www/www_rc')
        mutex.release(self.kmotion_dir, 'www_rc')
                
    
    def get_version(self):
        """        
        Returns the latest kmotion software version by parsing the webpage
        'http://code.google.com/p/kmotion-v2-code/downloads/list'
        
        args    : 
        excepts : 
        return  : str ... the version string or 'failed_parse'
        """
        
        url = 'http://code.google.com/p/kmotion-v2-code/downloads/list'
        opener = urllib.FancyURLopener()
        try: # read the webpage
            f_obj = opener.open(url)
            html = f_obj.read()
            f_obj.close()
        except IOError:
            logger.log('can\'t parse latest version from  \'%s\' IOError' % url, 'CRIT')
            return 'failed_parse' 
            
        # parse the webpage for the current version, if not there must be an 
        # 'unauthorised' version ie SVN
        start = html.find('http://kmotion-v2-code.googlecode.com/files/kmotion_' + self.version.replace(' ', '_') + '.tar.gz')
        if start == -1:
            logger.log('running SVN version', 'DEBUG')
            return 'SVN' 
        
        # parse the webpage for the latest version
        start = html.find('http://kmotion-v2-code.googlecode.com/files/kmotion_') + 52
        end = html.find('.tar.gz', start)
        
        if start == 44: # cant find = -1, plus 45 = 44
            logger.log('can\'t parse latest version from  \'%s\' can\'t find string' % url, 'CRIT')
            return 'failed_parse' 
        
        return html[start:end].replace('_', ' ')
                
    
    def ping_server_0000(self):
        """        
        Loads the 'server_0000' file at midnight
        
        args    : 
        excepts : 
        return  : 
        """
        
        url = 'http://kmotion2.googlecode.com/files/server_0000?rnd=' + str(time.time())
        opener = urllib.FancyURLopener()
        try: 
            f_obj = opener.open(url)
            f_obj.read()
            f_obj.close()
        except IOError:
            pass
    
    
    def build_smovie_cache(self, date):
        """   
        Scans the 'images_dbase' for 'smovie' directories that are not todays 
        date when found create 'smovie_cache''s for those directories.
        
        args    : date ...             the excluded date
        excepts : 
        returns : 
        """
        
        valid_feeds = ['%02i' % i for i in range(1, self.max_feed)] # 01 - 16
        
        for date in [ i for i in os.listdir(self.images_dbase_dir) if i != date]: 
            for feed in [int(i) for i in os.listdir('%s/%s' % (self.images_dbase_dir, date)) if i in valid_feeds]:
                
                feed_dir = '%s/%s/%02i' % (self.images_dbase_dir, date, feed)
                
                if os.path.isdir('%s/smovie' % feed_dir) and not os.path.isfile('%s/smovie_cache' % feed_dir):
                    logger.log('creating \'%s/smovie_cache\'' % feed_dir, 'CRIT')
                    
                    # smovie in need of a cache, build cache
                    coded_str = self.smovie_journal_data(date, feed)
                    f_obj = open('%s/smovie_cache' % feed_dir, 'w')
                    f_obj.writelines(coded_str.replace('$', '\n$')[1:])
                    f_obj.close()
                        
            
    def smovie_journal_data(self, date, feed):
        """   
        Returns a coded string containing data on the 'smovie' directory.
        
        coded string consists of:
        
        $<HHMMSS start>#<?? start items>#<?? fps>#<HHMMSS end>#<?? end items>...
        
        args    : date ...             the required date
                  feed ...             the required feed
        excepts : 
        returns : string data blob 
        """
        
        start, end = self.scan_image_dbase(date, feed)
        fps_time, fps = self.fps_journal_data(date, feed)
        
        # merge the 'movie' and 'fps' data
        coded_str = ''
        for i in range(len(start)):
            coded_str += '$%s' % start[i]
            coded_str += '#%s' % len(os.listdir('%s/%s/%02i/smovie/%s' % (self.images_dbase_dir, date, feed, start[i])))
        
            fps_latest = 0 # scan for correct fps time slot
            for j in range(len(fps_time)):
                if  start[i] < fps_time[j]: break
                fps_latest = fps[j]
            
            coded_str += '#%s' % fps_latest
            
            coded_str += '#%s' % end[i]
            coded_str += '#%s' % len(os.listdir('%s/%s/%02i/smovie/%s' % (self.images_dbase_dir, date, feed, end[i])))

        return coded_str
             
    
    def scan_image_dbase(self, date_, feed):  
        """
        Scan the 'images_dbase' directory looking for breaks that signify 
        different 'smovie's, store in 'start' and 'end' and return as a pair
        of identically sized lists
        
        args    : date ...             the required date
                  feed ...             the required feed
        excepts : 
        returns : start ...            lists the movie start times
                  end ...              lists the movie end times
        """
        
        start, end = [], []
        smovie_dir = '%s/%s/%02i/smovie' % (self.images_dbase_dir, date_, feed)
        
        if os.path.isdir(smovie_dir):
            movie_secs = os.listdir(smovie_dir)
            movie_secs.sort()
            
            if len(movie_secs) > 0:
                old_sec = -2
                old_movie_sec = 0
                
                for movie_sec in movie_secs:
                    sec = int(movie_sec[0:2]) * 3600 + int(movie_sec[2:4]) * 60 + int(movie_sec[4:6])
                    if sec != old_sec + 1:
                        start.append('%06s' % movie_sec)
                        if old_sec != -2: end.append('%06s' % old_movie_sec)
                    old_sec = sec
                    old_movie_sec = movie_sec
                end.append(movie_sec)  
        
        return start, end
        
        
    def fps_journal_data(self, date, feed):  
        """   
        Parses 'fps_journal' and returns two lists of equal length, one of start 
        times, the other of fps values.
        
        args    : date ...             the required date
                  feed ...             the required feed
        excepts : 
        returns : time ...             list of fps start times
                  fps ...              list of fps
        """
             
        time_, fps = [], []
        journal_file = '%s/%s/%02i/fps_journal' % (self.images_dbase_dir, date, feed)
        
        f_obj = open(journal_file)
        journal = f_obj.readlines()
        f_obj.close()
        
        journal = [i.strip('\n$') for i in journal] # clean the journal
        
        for line in journal:
            data = line.split('#')
            time_.append(data[0])
            fps.append(int(data[1]))

        return time_, fps
         
    
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
                
                f_obj = open('%s/dir_size' % date_dir)
                bytes_ += int(f_obj.readline())
                f_obj.close()
    
        logger.log('images_dbase_size() - size : %s' % bytes_, 'DEBUG')
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
                if os.path.isdir('%s/smovie' % feed_dir):
                    bytes_ += self.size_smovie(feed_dir)
                if os.path.isdir('%s/snap' % feed_dir):
                    bytes_ += self.size_snap(feed_dir) 
        
            logger.log('update_dbase_sizes() - size : %s' % bytes_, 'DEBUG')
            
            f_obj = open('%s/dir_size' % date_dir, 'w')
            f_obj.write(str(bytes_))
            f_obj.close()
        
        
    def size_movie(self, feed_dir):
        """
        Returns the size of feed_dir/movie dir in bytes. There will not be as 
        many files here as in the snap or smovie dirs
        
        args    : feed_dir ... the full path to the feed dir
        excepts : 
        return  : int ...      the size of feed_dir/movie dir in bytes
        """
        
        # don't use os.path.getsize as it does not report disk useage
        f_obj = os.popen('nice -n 19 du -s %s/movie' % feed_dir)
        line = f_obj.readline()
        f_obj.close()
        
        bytes_ = int(line.split()[0]) * 1000
        logger.log('size_movie() - %s size : %s' % (feed_dir, bytes_), 'DEBUG')
        return bytes_

    
    def size_smovie(self, feed_dir):
        """
        Returns the size of feed_dir/smovie dir in bytes. An average size for 
        each of 8 time zones is calculated and a fast file head count is then 
        used for each time zone.
        
        args    : feed_dir ... the full path to the feed dir
        excepts : 
        return  : int ...      the size of feed_dir/smovie dir in bytes
        """
        
        tzone_dirs = [[], [], [], [], [], [], [], []]
        dirs = os.listdir('%s/smovie' % feed_dir)
        dirs.sort()
        
        for dir_ in dirs:
            if dir_ >= '000000' and dir_ < '030000':
                tzone_dirs[0].append(dir_) 
            elif dir_ >= '030000' and dir_ < '060000':
                tzone_dirs[1].append(dir_) 
            elif dir_ >= '060000' and dir_ < '090000':
                tzone_dirs[2].append(dir_) 
            elif dir_ >= '090000' and dir_ < '120000':
                tzone_dirs[3].append(dir_) 
            elif dir_ >= '120000' and dir_ < '150000':
                tzone_dirs[4].append(dir_) 
            elif dir_ >= '150000' and dir_ < '180000':
                tzone_dirs[5].append(dir_) 
            elif dir_ >= '180000' and dir_ < '210000':
                tzone_dirs[6].append(dir_) 
            elif dir_ >= '210000' and dir_ <= '235959':
                tzone_dirs[7].append(dir_) 
    
        total_size = 0
               
        for tzone in range(8):
            num_dirs = len(tzone_dirs[tzone])
            
            if num_dirs == 0:
                continue

            sample = min(num_dirs, 30) # sample max 30 dirs
            total_bytes = 0
            
            for i in range(sample): 
                dir_ = tzone_dirs[tzone][i]
                
                # don't use os.path.getsize as it does not report disk useage
                f_obj = os.popen('nice -n 19 du -s %s/smovie/%s' % (feed_dir, dir_))
                line = f_obj.readline()
                f_obj.close()
                total_bytes += int(line.split()[0]) * 1000

            total_size += num_dirs * (total_bytes / sample)

        logger.log('size_smovie() - %s size : %s' % (feed_dir, total_size), 'DEBUG')
        return total_size
        
    
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
                f_obj = os.popen('nice -n 19 du -s %s/snap/%s' % (feed_dir, jpeg))
                line = f_obj.readline()
                f_obj.close()
                total_bytes += int(line.split()[0]) * 1000
                
            total_size += num_jpegs * (total_bytes / sample)
        
        logger.log('size_snap() - %s size : %s' % (feed_dir, total_size), 'DEBUG')
        return total_size
        
    
    def read_config(self):
        """ 
        Read self.images_dbase_dir and self.max_size_gb from kmotion_rc and
        self.version from kmotion_rc. If kmotion_rc is corrupt logs error and exits
        
        args    :
        excepts : 
        return  : none
        """
        
        self.kmotion_dir = os.getcwd()[:-5]
        
        parser = self.mutex_kmotion_parser_rd(self.kmotion_dir)
        
        try: # try - except because kmotion_rc is a user changeable file
            self.version = parser.get('version', 'string')
    	    self.max_feed = parser.getint('misc', 'max_feed')
            self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
            # 2**30 = 1GB
            self.max_size_gb = int(parser.get('storage', 'images_dbase_limit_gb')) * 2**30
            
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            logger.log('** CRITICAL ERROR ** corrupt \'kmotion_rc\': %s' % 
                       sys.exc_info()[1], 'CRIT')
            logger.log('** CRITICAL ERROR ** killing all daemons and terminating', 'CRIT')
            daemon_whip.kill_daemons()
            
            
    def mutex_www_parser_rd(self, kmotion_dir):
        """
        Safely generate a parser instance and under mutex control read 'www_rc'
        returning the parser instance.
        
        args    : kmotion_dir ... the 'root' directory of kmotion   
        excepts : 
        return  : parser ... a parser instance
        """
        
        parser = ConfigParser.SafeConfigParser()
        try:
            mutex.acquire(kmotion_dir, 'www_rc')
            parser.read('%s/www/www_rc' % kmotion_dir)
        finally:
            mutex.release(kmotion_dir, 'www_rc')
        return parser
     
     
    def mutex_www_parser_wr(self, kmotion_dir, parser):
        """
        Safely write a parser instance to 'www_rc' under mutex control.
        
        args    : kmotion_dir ... the 'root' directory of kmotion
                  parser      ... the parser instance 
        excepts : 
        return  : 
        """
    
        try:
            mutex.acquire(kmotion_dir, 'www_rc')
            f_obj = open('%s/www/www_rc' % kmotion_dir, 'w')
            parser.write(f_obj)
            f_obj.close()
        finally:
            mutex.release(kmotion_dir, 'www_rc')
            
            
    def mutex_kmotion_parser_rd(self, kmotion_dir):
        """
        Safely generate a parser instance and under mutex control read 'www_rc'
        returning the parser instance.
        
        args    : kmotion_dir ... the 'root' directory of kmotion   
        excepts : 
        return  : parser ... a parser instance
        """
        
        parser = ConfigParser.SafeConfigParser()
        try:
            mutex.acquire(kmotion_dir, 'kmotion_rc')
            parser.read('%s/kmotion_rc' % kmotion_dir)
        finally:
            mutex.release(kmotion_dir, 'kmotion_rc')
        return parser

        
            
    def signal_hup(self, signum, frame):
        """
        On SIGHUP re-read the config file 
        
        args    : discarded
        excepts : 
        return  : none
        """
        
        logger.log('signal SIGHUP detected, re-reading config file', 'CRIT')
        self.read_config()
        
    
    def signal_term(self, signum, frame):
        """
        On SIGTERM raise 'SigTerm' as a special case
        
        args    : discarded
        excepts : 
        return  : none
        """

        raise SigTerm



# it is CRUCIAL that this code is bombproof
while True:
    update_logs.add_startup_event()
    try:    
	#print Kmotion_Hkd1().images_dbase_size()
	#print Kmotion_Hkd1().max_size_gb
        Kmotion_Hkd1().main()
        
    except SigTerm: # special case for propogated SIGTERM
        update_logs.add_shutdown_event()
        sys.exit()
    except: # global exception catch        
        exc_type, exc_value, exc_traceback = sys.exc_info()
        exc_trace = traceback.extract_tb(exc_traceback)[-1]
        exc_loc1 = '%s' % exc_trace[0]
        exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
        
        logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - type: %s' 
                   % exc_type, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - value: %s' 
                   % exc_value, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - traceback: %s' 
                   %exc_loc1, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_hkd1 crash - traceback: %s' 
                   %exc_loc2, 'CRIT')
        time.sleep(60)
        
        

    
