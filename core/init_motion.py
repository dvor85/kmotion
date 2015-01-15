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
Exports various methods used to initialize motion configuration. These methods
have been moved to this seperate module to reduce issues when the motion API
changes. All changes should be in just this module.
"""

import os
import logger
from mutex_parsers import *


class InitMotion:
    
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir):
        self.logger = logger.Logger('init_motion', InitMotion.log_level)
        self.kmotion_dir = kmotion_dir
        self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.www_parser = mutex_www_parser_rd(self.kmotion_dir)
        
        self.images_dbase_dir = self.kmotion_parser.get('dirs', 'images_dbase_dir')     
        self.ramdisk_dir = self.kmotion_parser.get('dirs', 'ramdisk_dir')
        self.max_feed = self.kmotion_parser.getint('misc', 'max_feed')
        
        self.feed_list = []
        for feed in range(1, self.max_feed):
            if self.www_parser.has_section('motion_feed%02i' % feed) and self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_enabled'):
                self.feed_list.append(feed)
                
    def gen_motion_configs(self):
        """
        Generates the motion.conf and thread??.conf files from www_rc and virtual
        motion conf files
                
        args    : kmotion_dir ... the 'root' directory of kmotion
        excepts : 
        return  : none
        """
        
        # delete all files in motion_conf skipping .svn directories
        for del_file in [del_file for del_file in os.listdir('%s/core/motion_conf' % self.kmotion_dir) 
                      if os.path.isfile('%s/core/motion_conf/%s' % (self.kmotion_dir, del_file))]:
            os.remove('%s/core/motion_conf/%s' % (self.kmotion_dir, del_file))
        
        if len(self.feed_list) > 0:  # only populate 'motion_conf' if valid feeds
            self.gen_motion_conf()
            self.gen_threads_conf()
      
    
    def gen_motion_conf(self):
        """
        Generates the motion.conf file from www_rc and the virtual motion conf files
                
        args    : kmotion_dir ... the 'root' directory of kmotion
                  feed_list ...   a list of enabled feeds
                  ramdisk_dir ... the ramdisk directory
        excepts : 
        return  : none
        """
        
        with open('%s/core/motion_conf/motion.conf' % self.kmotion_dir, 'w') as f_obj1:
            print >> f_obj1, '''
# ------------------------------------------------------------------------------
# This config file has been automatically generated by kmotion
# Do __NOT__ modify it in any way.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 'default' section
# ------------------------------------------------------------------------------

quiet on

# ------------------------------------------------------------------------------
# 'user' section from 'virtual_motion_conf/motion.conf'
# ------------------------------------------------------------------------------
'''
            # this is a user changable file so error trap
            try:
                with open('%s/virtual_motion_conf/motion.conf' % self.kmotion_dir) as f_obj2:
                    user_conf = f_obj2.read()
            except IOError:   
                print >> f_obj1, '# virtual_motion_conf/motion.conf not readable - ignored'
                self.logger.log('no motion.conf readable in virtual_motion_conf dir - none included in final motion.conf', 'CRIT')
            else:
                print >> f_obj1, user_conf
            
            print >> f_obj1, '''
# ------------------------------------------------------------------------------
# 'override' section
# ------------------------------------------------------------------------------

daemon off
control_port 8080
control_localhost on
'''
        
            for feed in self.feed_list:
                print >> f_obj1, 'thread %s/core/motion_conf/thread%02i.conf\n' % (self.kmotion_dir, feed)
    
      
    def gen_threads_conf(self):
        """
        Generates the thread??.conf files from www_rc and the virtual motion conf 
        files
                
        args    : kmotion_dir ...      the 'root' directory of kmotion
                  feed_list ...        a list of enabled feeds
                  ramdisk_dir ...      the ram disk directory
                  images_dbase_dir ... the images dbase directory
        excepts : 
        return  : none
        """
        
        for feed in self.feed_list:
            with open('%s/core/motion_conf/thread%02i.conf' % (self.kmotion_dir, feed), 'w') as f_obj1:
                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# This config file has been automatically generated by kmotion
# Do __NOT__ modify it in any way.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 'default' section
# ------------------------------------------------------------------------------

gap 2
pre_capture 1
post_capture 16
quality 85
webcam_localhost on
ffmpeg_bps 400000'''
            
                # pal or ntsc,
                if self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_pal'):
                    print >> f_obj1, 'norm 0' 
                else:
                    print >> f_obj1, 'norm 1' 
                    
                # feed mask, 
                if self.www_parser.get('motion_feed%02i' % feed, 'feed_mask') != '0#0#0#0#0#0#0#0#0#0#0#0#0#0#0#':
                    print >> f_obj1, 'mask_file %s/core/masks/mask%0.2d.pgm' % (self.kmotion_dir, feed)  
                    
                # framerate,
                if (self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_smovie_enabled') or 
                    self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_movie_enabled')):
                    print >> f_obj1, 'framerate %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_fps')
                else:
                    print >> f_obj1, 'framerate 3'  # default for feed updates
                
                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# 'user' section from 'virtual_motion_conf/thread%02i.conf'
# ------------------------------------------------------------------------------
''' % feed
            
                # this is a user changable file so error trap
                try:
                    with open('%s/virtual_motion_conf/thread%02i.conf' % (self.kmotion_dir, feed)) as f_obj2:
                        user_conf = f_obj2.read()
                except IOError:   
                    print >> f_obj1, '# virtual_motion_conf/thread%02i.conf not readable - ignored' % feed
                    self.logger.log('no feed%02i.conf readable in virtual_motion_conf dir - none included in final motion.conf' % feed, 'CRIT')
                else:
                    print >> f_obj1, user_conf
                
                print >> f_obj1, '''
                
# ------------------------------------------------------------------------------
# 'override' section
# ------------------------------------------------------------------------------

#ffmpeg_video_codec swf
snapshot_interval 1
#webcam_localhost on
'''
                print >> f_obj1, 'target_dir %s' % self.ramdisk_dir
                
                # device and input
                feed_device = int(self.www_parser.get('motion_feed%02i' % feed, 'feed_device'))
                if feed_device > -1:  # /dev/video? device
                    print >> f_obj1, 'videodevice /dev/video%s' % feed_device
                    print >> f_obj1, 'input %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_input')
                else:  # netcam
                    print >> f_obj1, 'netcam_url  %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_url')
                    print >> f_obj1, 'netcam_proxy %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_proxy')
                    print >> f_obj1, 'netcam_userpass %s:%s' % (self.www_parser.get('motion_feed%02i' % feed, 'feed_lgn_name'), self.www_parser.get('motion_feed%02i' % feed, 'feed_lgn_pw'))
                    
                print >> f_obj1, 'width %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_width') 
                print >> f_obj1, 'height %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_height') 
                
                # show motion box
                if self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_show_box'): 
                    print >> f_obj1, 'locate on'
                     
                # ptz enabled, if 'ptz_track_type' == 9, useing plugins, disable here
                if self.www_parser.getboolean('motion_feed%02i' % feed, 'ptz_enabled') and self.www_parser.getint('motion_feed%02i' % feed, 'ptz_track_type') < 9: 
                    print >> f_obj1, 'track_type %s' % self.www_parser.get('motion_feed%02i' % feed, 'ptz_track_type')
                    
                # prefix to 'walk backwards' from the 'target_dir'
                #rel_prefix = ('../' * len(self.ramdisk_dir.split('/')))[:-1]    
                
                # always on for feed updates
                if (self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_smovie_enabled')):
                    print >> f_obj1, 'output_normal on'
                    print >> f_obj1, 'jpeg_filename %s/%%Y%%m%%d/%0.2d/smovie/%%H%%M%%S/%%q' % (self.images_dbase_dir, feed)
                else:
                    print >> f_obj1, 'output_normal off'
                    print >> f_obj1, 'jpeg_filename %s/%%Y%%m%%d/%0.2d/snap/%%H%%M%%S' % (self.images_dbase_dir, feed)
        
                # movie mode
                if self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_movie_enabled'): 
                    print >> f_obj1, 'ffmpeg_cap_new on'
                else:
                    print >> f_obj1, 'ffmpeg_cap_new off'
                    
                print >> f_obj1, '' 
                
                print >> f_obj1, 'movie_filename %s/%%Y%%m%%d/%0.2d/movie/%%H%%M%%S' % (self.images_dbase_dir, feed)
                print >> f_obj1, 'snapshot_filename %0.2d/%%Y%%m%%d%%H%%M%%S' % feed
                # 'on_movie_start' not recorded, uses 'movie_filename' for more accuracy
                # print >> f_obj1, 'on_movie_start echo \'$%%H%%M%%S\' >> %s/%%Y%%m%%d/%0.2d/movie_journal' % (images_dbase_dir, feed)
                print >> f_obj1, 'on_movie_end echo \'$%%H%%M%%S\' >> %s/%%Y%%m%%d/%0.2d/movie_journal' % (self.images_dbase_dir, feed)
                print >> f_obj1, 'on_event_start %s/core/event_start.sh %%t' % (self.kmotion_dir)
                print >> f_obj1, 'on_event_end %s/core/event_end.sh %%t' % (self.kmotion_dir)
                print >> f_obj1, 'on_camera_lost %s/core/camera_lost.sh %%t' % (self.kmotion_dir)
                # print >> f_obj1, 'on_picture_save ln -sf %%f %s/%0.2d/last.jpg' % (ramdisk_dir, feed)
                print >> f_obj1, 'on_picture_save %s/core/picture_save.sh %%f' % (self.kmotion_dir)
            


# Module test code

if __name__ == '__main__':
    
    print '\nModule self test ... generating motion.conf and threads\n'
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    InitMotion(kmotion_dir).gen_motion_configs()
    
