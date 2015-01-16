#!/usr/bin/env python
# Copyright 2008 David Selby dave6502googlemail.com

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
Waits on the 'fifo_settings_wr' fifo until data received then parse the data
and modifiy 'www_rc', also updates 'feeds_cache'
"""

import sys, os.path, subprocess, logger, time, traceback
import sort_rc
import signal
from mutex_parsers import *
from mutex import Mutex
from init_motion import InitMotion
from threading import Thread


class Kmotion_setd(Thread):
    log_level = 'WARNING'
    
    
    def __init__(self, kmotion_dir):
        Thread.__init__(self)
        self.kmotion_dir = kmotion_dir
        self.logger = logger.Logger('kmotion_setd', Kmotion_setd.log_level)
        self.setName('kmotion_hkd2')
        self.setDaemon(True)
        
    def stop(self):
        os.kill(os.getpid(), signal.SIGTERM)

    def main(self):  
        """
        Waits on the 'fifo_settings_wr' fifo until data received then parse the data
        and modifiy 'www_rc', also updates 'feeds_cache'
        
        ine ... interleave enabled
        fse ... full screen enabled
        lbe ... low bandwidth enabled
        lce ... low CPU enabled
        skf ... skip archive frames
        are ... archive button enabled
        lge ... logs button enabled
        coe ... config button enabled
        fue ... func button enabled
        spa ... msg button enabled
        abe ... about button enabled
        loe ... logout button enabled
        
        sec ... secure config
        coh ... config hash code
        
        fma ... feed mask
        
        fen ... feed enabled
        fpl ... feed pal 
        fde ... feed device
        fin ... feed input
        ful ... feed url
        fpr ... feed proxy
        fln ... feed loggin name
        flp ... feed loggin password
        fwd ... feed width
        fhe ... feed height
        fna ... feed name
        fbo ... feed show box
        ffp ... feed fps
        fpe ... feed snap enabled
        fsn ... feed snap interval
        ffe ... feed smovie enabled
        fme ... feed movie enabled
        fup ... feed updates
        
        psx ... PTZ step x
        psy ... PTZ step y
        ptt ... PTZ track type
        pte ... PTZ enabled
        ptc ... PTZ calib first
        pts ... PTZ servo settle
        ppe ... PTZ park enabled
        ppd ... PTZ park delay
        ppx ... PTZ park x
        ppy ... PTZ park y
        p1x ... PTZ preset 1 x
        p1y ... PTZ preset 1 y
        p2x ... PTZ preset 2 x
        p2y ... PTZ preset 2 y
        p3x ... PTZ preset 3 x
        p3y ... PTZ preset 3 y
        p4x ... PTZ preset 4 x
        p4y ... PTZ preset 4 y
        
        sex ... schedule exception
        st1 ... schedule time line 1
        st2 ... schedule time line 2
        st3 ... schedule time line 3
        st4 ... schedule time line 4
        st5 ... schedule time line 5
        st6 ... schedule time line 6
        st7 ... schedule time line 7
        
        ed1 ... exception time line 1 dates   
        ed2 ... exception time line 2 dates      
        ed3 ... exception time line 3 dates    
        ed4 ... exception time line 4 dates
        ed5 ... exception time line 5 dates
        ed6 ... exception time line 6 dates
        ed7 ... exception time line 7 dates
    
        et1 ... exception time line 1    
        et2 ... exception time line 2       
        et3 ... exception time line 3    
        et4 ... exception time line 4
        et5 ... exception time line 5
        et6 ... exception time line 6
        et7 ... exception time line 7
    
        dif ... display feeds
        col ... color select
        dis ... display select
        
        chk ... length check
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('starting daemon ...', 'CRIT')
        init_motion = InitMotion(self.kmotion_dir)
        
        reload_ptz_config = False
        reload_all_config = False
        
        RELOAD_PTZ = ['psx', 'psy', 'ptc', 'pts', 'ppe', 'ppd', 'ppx', 'ppy',
                       'p1x', 'p1y', 'p2x', 'p2y', 'p3x', 'p3y', 'p4x', 'p4y']
        
        RELOAD_ALL = ['fma', 'fen', 'fpl', 'fde', 'fin', 'ful', 'fpr', 'fln',
                       'flp', 'fwd', 'fhe', 'fbo', 'ffp', 'fpe', 'fsn', 'ffe',
                       'fme', 'fup', 'ptt', 'pte', 'sex', 'st1', 'st2', 'st3',
                       'st4', 'st5', 'st6', 'st7', 'ed1', 'ed2', 'ed3', 'wd4',
                       'ed5', 'ed6', 'ed7', 'et1', 'et2', 'et3', 'et4', 'et5',
                       'et6', 'et7']
        
        # update_feeds_cache(kmotion_dir)
        
        
        user = ''
        www_rc = 'www_rc'
        
        
        while True:
            
            self.logger.log('waiting on FIFO pipe data', 'DEBUG')
            data = subprocess.Popen(['cat', '%s/www/fifo_settings_wr' % self.kmotion_dir], stdout=subprocess.PIPE).communicate()[0]
            data = data.rstrip()        
            self.logger.log('kmotion FIFO pipe data: %s' % data, 'CRIT')
            
            if len(data) < 8:
                continue
            
            if len(data) > 7 and data[-8:] == '99999999':  # FIFO purge
                self.logger.log('FIFO purge', 'DEBUG')
                continue
    
            if int(data[-8:]) != len(data) - 13:  # filter checksum
                self.logger.log('data checksum error - rejecting data', 'CRIT')
                continue
            
    
            masks_modified = []  # reset masks changed list
            
            
        
            raws_data = data.split('$')
            for raw_data in raws_data:
                if raw_data == '': continue  # filter starting ''
                split_data = raw_data.split(':')
                if split_data[0][:3] == 'usr':
                    user = split_data[1]
                break
    
            must_reload = True
            www_rc = 'www_rc_%s' % user
            if not os.path.isfile(www_rc):
                www_rc = 'www_rc'
            else:
                must_reload = False
            
            
            self.logger.log('kmotion_setd user: %s' % user, 'CRIT')
            parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
            
            for raw_data in raws_data:
                if raw_data == '': continue  # filter starting ''
                split_data = raw_data.split(':')
    
                if len(split_data[0]) > 3:
                    key = split_data[0][:3]
                    index = int(split_data[0][3:])
                else:
                    key = split_data[0]  # the 3 digit key ie 'fen' or 'fha'
                    index = 0  # optional list pointer for the id
                value = split_data[1]
                
                if key == 'ine':  # interleave
                    parser.set('misc', 'misc1_interleave', num_bool(value))
                elif key == 'fse':  # full screen
                    parser.set('misc', 'misc1_full_screen', num_bool(value))
                elif key == 'lbe':  # low bandwidth
                    parser.set('misc', 'misc1_low_bandwidth', num_bool(value))
                elif key == 'lce':  # low cpu
                    parser.set('misc', 'misc1_low_cpu', num_bool(value))
                elif key == 'skf':  # skip archive frames enabled
                    parser.set('misc', 'misc1_skip_frames', num_bool(value))
                elif key == 'are':  # archive button enabled
                    parser.set('misc', 'misc2_archive_button_enabled', num_bool(value))
                elif key == 'lge':  # logs button enabled
                    parser.set('misc', 'misc2_logs_button_enabled', num_bool(value))
                elif key == 'coe':  # config button enabled
                    parser.set('misc', 'misc2_config_button_enabled', num_bool(value))
                elif key == 'fue':  # function button enabled
                    parser.set('misc', 'misc2_func_button_enabled', num_bool(value))
                elif key == 'spa':  # update button enabled
                    parser.set('misc', 'misc2_msg_button_enabled', num_bool(value))
                elif key == 'abe':  # about button enabled
                    parser.set('misc', 'misc2_about_button_enabled', num_bool(value))
                elif key == 'loe':  # logout button enabled
                    parser.set('misc', 'misc2_logout_button_enabled', num_bool(value))
                elif key == 'hbb':  # hide_button_bar
                    parser.set('misc', 'hide_button_bar', num_bool(value))
    
                elif key == 'sec':  # secure config
                    parser.set('misc', 'misc3_secure', num_bool(value))
                elif key == 'coh':  # config hash
                    parser.set('misc', 'misc3_config_hash', value)
            
                elif key == 'fma':  # feed mask
                    parser.set('motion_feed%02i' % index, 'feed_mask', value)
                    masks_modified.append((index, value))
            
                elif key == 'fen':  # feed enabled
                    parser.set('motion_feed%02i' % index, 'feed_enabled', num_bool(value))
                elif key == 'fpl':  # feed pal 
                    parser.set('motion_feed%02i' % index, 'feed_pal', num_bool(value))
                elif key == 'fde':  # feed device
                    parser.set('motion_feed%02i' % index, 'feed_device', value)
                elif key == 'fin':  # feed input
                    parser.set('motion_feed%02i' % index, 'feed_input', value)
                elif key == 'ful':  # feed url
                    parser.set('motion_feed%02i' % index, 'feed_url', '"%s"' % de_sanitise(value))
                elif key == 'fpr':  # feed proxy
                    parser.set('motion_feed%02i' % index, 'feed_proxy', '"%s"' % de_sanitise(value))
                elif key == 'fln':  # feed loggin name
                    parser.set('motion_feed%02i' % index, 'feed_lgn_name', de_sanitise(value))
                elif key == 'flp':  # feed loggin password
                    # check to see if default *'d password is returned
                    if de_sanitise(value) != '*' * len(parser.get('motion_feed%02i' % index, 'feed_lgn_pw')):
                        parser.set('motion_feed%02i' % index, 'feed_lgn_pw', de_sanitise(value))
                elif key == 'fwd':  # feed width
                    parser.set('motion_feed%02i' % index, 'feed_width', value)
                elif key == 'fhe':  # feed height
                    parser.set('motion_feed%02i' % index, 'feed_height', value)
                elif key == 'fna':  # feed name
                    parser.set('motion_feed%02i' % index, 'feed_name', de_sanitise(value))
                elif key == 'fbo':  # feed show box
                    parser.set('motion_feed%02i' % index, 'feed_show_box', num_bool(value))
                elif key == 'ffp':  # feed fps
                    parser.set('motion_feed%02i' % index, 'feed_fps', value)
                elif key == 'fpe':  # feed snap enabled
                    parser.set('motion_feed%02i' % index, 'feed_snap_enabled', num_bool(value))
                elif key == 'fsn':  # feed snap interval
                    parser.set('motion_feed%02i' % index, 'feed_snap_interval', value)
                elif key == 'ffe':  # feed smovie enabled
                    parser.set('motion_feed%02i' % index, 'feed_smovie_enabled', num_bool(value))
                elif key == 'fme':  # feed movie enabled
                    parser.set('motion_feed%02i' % index, 'feed_movie_enabled', num_bool(value))
                    
                elif key == 'psx':  # ptz step x
                    parser.set('motion_feed%02i' % index, 'ptz_step_x', value)                
                elif key == 'psy':  # ptz step y
                    parser.set('motion_feed%02i' % index, 'ptz_step_y', value)
                elif key == 'ptt':  # ptz calib first
                    parser.set('motion_feed%02i' % index, 'ptz_track_type', value)
            
                elif key == 'pte':  # ptz enabled
                    parser.set('motion_feed%02i' % index, 'ptz_enabled', num_bool(value))
                elif key == 'ptc':  # ptz calib first
                    parser.set('motion_feed%02i' % index, 'ptz_calib_first', num_bool(value))
                elif key == 'pts':  # ptz servo settle
                    parser.set('motion_feed%02i' % index, 'ptz_servo_settle', value)
                elif key == 'ppe':  # ptz park enable
                    parser.set('motion_feed%02i' % index, 'ptz_park_enabled', num_bool(value))
                elif key == 'ppd':  # ptz park delay
                    parser.set('motion_feed%02i' % index, 'ptz_park_delay', value)
                elif key == 'ppx':  # ptz park x
                    parser.set('motion_feed%02i' % index, 'ptz_park_x', value)
                elif key == 'ppy':  # ptz park y
                    parser.set('motion_feed%02i' % index, 'ptz_park_y', value)
                elif key == 'p1x':  # ptz preset 1 x
                    parser.set('motion_feed%02i' % index, 'ptz_preset1_x', value)                
                elif key == 'p1y':  # ptz preset 1 y
                    parser.set('motion_feed%02i' % index, 'ptz_preset1_y', value)
                elif key == 'p2x':  # ptz preset 2 x
                    parser.set('motion_feed%02i' % index, 'ptz_preset2_x', value)                
                elif key == 'p2y':  # ptz preset 2 y
                    parser.set('motion_feed%02i' % index, 'ptz_preset2_y', value)
                elif key == 'p3x':  # ptz preset 3 x
                    parser.set('motion_feed%02i' % index, 'ptz_preset3_x', value)                
                elif key == 'p3y':  # ptz preset 3 y
                    parser.set('motion_feed%02i' % index, 'ptz_preset3_y', value)
                elif key == 'p4x':  # ptz preset 4 x
                    parser.set('motion_feed%02i' % index, 'ptz_preset4_x', value)                
                elif key == 'p4y':  # ptz preset 4 y
                    parser.set('motion_feed%02i' % index, 'ptz_preset4_y', value)
            
                elif key == 'sex':  # schedule exception
                    parser.set('schedule%i' % index, 'schedule_except', value)
                elif key == 'st1':  # schedule time line 1
                    parser.set('schedule%i' % index, 'tline1', value)
                elif key == 'st2':  # schedule time line 2
                    parser.set('schedule%i' % index, 'tline2', value)
                elif key == 'st3':  # schedule time line 3
                    parser.set('schedule%i' % index, 'tline3', value)
                elif key == 'st4':  # schedule time line 4
                    parser.set('schedule%i' % index, 'tline4', value)
                elif key == 'st5':  # schedule time line 5
                    parser.set('schedule%i' % index, 'tline5', value)
                elif key == 'st6':  # schedule time line 6
                    parser.set('schedule%i' % index, 'tline6', value)
                elif key == 'st7':  # schedule time line 7
                    parser.set('schedule%i' % index, 'tline7', value)
                    
                elif key == 'ed1':  # exception time line 1 dates
                    parser.set('schedule_except%i' % index, 'tline1_dates', value)
                elif key == 'ed2':  # exception time line 2 dates
                    parser.set('schedule_except%i' % index, 'tline2_dates', value)
                elif key == 'ed3':  # exception time line 3 dates
                    parser.set('schedule_except%i' % index, 'tline3_dates', value)
                elif key == 'ed4':  # exception time line 4 dates
                    parser.set('schedule_except%i' % index, 'tline4_dates', value)
                elif key == 'ed5':  # exception time line 5 dates
                    parser.set('schedule_except%i' % index, 'tline5_dates', value)
                elif key == 'ed6':  # exception time line 6 dates
                    parser.set('schedule_except%i' % index, 'tline6_dates', value)
                elif key == 'ed7':  # exception time line 7 dates
                    parser.set('schedule_except%i' % index, 'tline7_dates', value)
                    
                elif key == 'et1':  # exception time line 1
                    parser.set('schedule_except%i' % index, 'tline1', value)
                elif key == 'et2':  # exception time line 2
                    parser.set('schedule_except%i' % index, 'tline2', value)
                elif key == 'et3':  # exception time line 3
                    parser.set('schedule_except%i' % index, 'tline3', value)
                elif key == 'et4':  # exception time line 4
                    parser.set('schedule_except%i' % index, 'tline4', value)
                elif key == 'et5':  # exception time line 5
                    parser.set('schedule_except%i' % index, 'tline5', value)
                elif key == 'et6':  # exception time line 6
                    parser.set('schedule_except%i' % index, 'tline6', value)
                elif key == 'et7':  # exception time line 7
                    parser.set('schedule_except%i' % index, 'tline7', value)
                    
                elif key == 'dif':  # display feeds
                    parser.set('misc', 'misc4_display_feeds_%02i' % index, value)
                elif key == 'col':  # color select
                    parser.set('misc', 'misc4_color_select', value)
                elif key == 'dis':  # display select
                    parser.set('misc', 'misc4_display_select', value)
                    
                # if key fits flag for reload everything including the ptz daemon, 
                # motion and everything else, slow and painfull
                if (key in RELOAD_ALL)and(must_reload) : reload_all_config = True
                
                # if key fits flag for reload the ptz daemon only. the ptz daemon is
                # quick to reload and does not have the crashy pants of a motion 
                # reload !
                if (key in RELOAD_PTZ)and(must_reload) : reload_ptz_config = True
                
            mutex_www_parser_wr(self.kmotion_dir, parser, www_rc)
            try:
                mutex = Mutex(self.kmotion_dir, 'www_rc')
                mutex.acquire()
                sort_rc.sort_rc('%s/www/%s' % (self.kmotion_dir, www_rc))
            finally:
                mutex.release()
            #update_feeds_cache()
            
            # has to be here, image width, height have to be written to 'www_rc'
            # before mask can be made
            for i in range(len(masks_modified)):
                self.create_mask(masks_modified[i][0], masks_modified[i][1], www_rc)
            
            if reload_all_config: 
                init_motion.gen_motion_configs(self.kmotion_dir)
                #daemon_whip.reload_all_configs()
                reload_all_config = False
                reload_ptz_config = False
                continue  # skip 'reload_ptz_config', already done
        
            if reload_ptz_config: 
                #daemon_whip.reload_ptz_config()
                reload_ptz_config = False 
                
    def create_mask(self, feed, mask_hex_str, www_rc):   
        """
        Create a motion PGM mask from 'mask_hex_string' for feed 'feed'. Save it
        as ../core/masks/mask??.png.
        
        args    : kmotion_dir ...  the 'root' directory of kmotion 
                  feed ...         the feed number
                  mask_hex_str ... the encoded mask hex string
        excepts : 
        return  : none
        """
    
        self.logger.log('create_mask() - mask hex string: %s' % mask_hex_str, 'DEBUG')
        parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
        image_width = parser.getint('motion_feed%02i' % feed, 'feed_width') 
        image_height = parser.getint('motion_feed%02i' % feed, 'feed_height')
        self.logger.log('create_mask() - width: %s height: %s' % (image_width, image_height), 'DEBUG')
        
        black_px = '\x00' 
        white_px = '\xFF' 
        
        mask = ''
        mask_hex_split = mask_hex_str.split('#')
        px_yptr = 0
        
        for y in range(15):
            
            tmp_dec = int(mask_hex_split[y], 16)
            px_xptr = 0
            image_line = ''
            
            for x in range(15, 0, -1):
            
                px_mult = (image_width - px_xptr) / x
                px_xptr += px_mult
                
                bin_ = tmp_dec & 16384
                tmp_dec <<= 1
                
                if bin_ == 16384:
                    image_line += black_px * px_mult
                else:
                    image_line += white_px * px_mult
            
                    
            px_mult = (image_height - px_yptr) / (15 - y)
            px_yptr += px_mult
                
            mask += image_line * px_mult
            
        with open('%s/core/masks/mask%0.2d.pgm' % (self.kmotion_dir, feed), mode='wb') as f_obj:
            print >> f_obj, 'P5'
            print >> f_obj, '%d %d' % (image_width, image_height)
            print >> f_obj, '255'
            print >> f_obj, mask
        self.logger.log('create_mask() - mask written', 'DEBUG')
        
        
    def run(self):
        while True:
            try:    
                self.main()
            except:  # global exception catch
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                self.logger.log('** CRITICAL ERROR ** kmotion_setd crash - type: %s' 
                           % exc_type, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_setd crash - value: %s' 
                           % exc_value, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_setd crash - traceback: %s' 
                           % exc_loc1, 'CRIT')
                self.logger.log('** CRITICAL ERROR ** kmotion_setd crash - traceback: %s' 
                           % exc_loc2, 'CRIT') 
                time.sleep(60)
        


def num_bool(num):
    """
    Converts a 1 or 0 to a 'true' or 'false' string 

    args    : int ... 1 for 'true', 0 for 'false'bool_str
    excepts : 
    return  : 'true' or 'false' string 
    """
    
    if int(num) == 1: return 'true'
    return 'false'


def de_sanitise(text):
    """
    Converts sanitised <...> to troublesome characters

    args    : text ... the text to be de-sanitised
    excepts : 
    return  : text ... the de-sanitised text
    """
    
    text = text.replace('<amp>', '&')
    text = text.replace('<que>', '?')
    text = text.replace('<col>', ':')
    return text
    



