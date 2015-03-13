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
Returns a coded string data blob containing kmotion settings
"""

import cgi, ConfigParser, os, time, random


def index(req):
    """
    Parses www_rc and returns a coded string in a dictionary like format, this
    coded string contains settings for the browser interface.
    
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
    fne ... function buttons enabled (for executable scripts)
     
    sec ... secure config
    coh ... config hash code
    
    fma ... feed mask
    
    fen ... feed enabled
    fde ... feed device
    fin ... feed input
    ful ... feed url
    fpr ... feed proxy
    fln ... feed loggin name
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
    
    dif ... display feeds
    col ... color select
    dis ... display select
    ver ... version
    vel ... version latest
    
    chk ... length check
    
    args    : 
    excepts : 
    return  : the coded string 
    """
    
    file_path = str(req.__getattribute__('filename'))
    www_dir = os.path.abspath('%s/../../..' % file_path)
    kmotion_dir = os.path.abspath('%s/..' % www_dir)
    
    parser = ConfigParser.SafeConfigParser()
    try:
        mutex_acquire(kmotion_dir)
        """return req.get_remote_host()"""
                        
        
	
	#ip=req.get_remote_host()
	user=req.user
		
	www_rc='%s/www_rc_%s' % (www_dir, user)
	if not os.path.isfile(www_rc):
	    www_rc='%s/www_rc' % (www_dir)
    	parser.read(www_rc)
    finally:
        mutex_release(kmotion_dir)
        
    max_feed = int(parser.get('system', 'max_feed'))
    
    coded_str = ''
    
    coded_str += '$ine:%s' % bool_num(parser.get('misc', 'misc1_interleave'))
    coded_str += '$fse:%s' % bool_num(parser.get('misc', 'misc1_full_screen'))
    coded_str += '$lbe:%s' % bool_num(parser.get('misc', 'misc1_low_bandwidth'))
    coded_str += '$lce:%s' % bool_num(parser.get('misc', 'misc1_low_cpu'))
    coded_str += '$skf:%s' % bool_num(parser.get('misc', 'misc1_skip_frames'))
    coded_str += '$are:%s' % bool_num(parser.get('misc', 'misc2_archive_button_enabled'))
    coded_str += '$lge:%s' % bool_num(parser.get('misc', 'misc2_logs_button_enabled'))
    coded_str += '$coe:%s' % bool_num(parser.get('misc', 'misc2_config_button_enabled'))
    coded_str += '$fue:%s' % bool_num(parser.get('misc', 'misc2_func_button_enabled'))
    coded_str += '$spa:%s' % bool_num(parser.get('misc', 'misc2_msg_button_enabled'))
    coded_str += '$abe:%s' % bool_num(parser.get('misc', 'misc2_about_button_enabled'))
    coded_str += '$loe:%s' % bool_num(parser.get('misc', 'misc2_logout_button_enabled'))
    
    coded_str += '$sec:%s' % bool_num(parser.get('misc', 'misc3_secure'))    
    coded_str += '$coh:%s' % parser.get('misc', 'misc3_config_hash')
    coded_str += '$mfd:%s' % max_feed
    
    for i in range(1, max_feed):
        
        coded_str += '$fma%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_mask'))
        coded_str += '$fen%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_enabled')))
        coded_str += '$fpl%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_pal')))
        coded_str += '$fde%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_device'))
        coded_str += '$fin%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_input'))
        coded_str += '$ful%i:%s' % (i, expand_chars(parser.get('motion_feed%02i' % i, 'feed_url')))
        coded_str += '$fpr%i:%s' % (i, expand_chars(parser.get('motion_feed%02i' % i, 'feed_proxy')))
        coded_str += '$fln%i:%s' % (i, expand_chars(parser.get('motion_feed%02i' % i, 'feed_lgn_name')))
        # don't want to send out real password
        coded_str += '$flp%i:%s' % (i, '*' * len(parser.get('motion_feed%02i' % i, 'feed_lgn_pw')))
        coded_str += '$fwd%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_width'))
        coded_str += '$fhe%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_height'))
        coded_str += '$fna%i:%s' % (i, expand_chars(parser.get('motion_feed%02i' % i, 'feed_name')))
        coded_str += '$fbo%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_show_box')))
        coded_str += '$ffp%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_fps'))
        
        coded_str += '$fpe%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_snap_enabled')))
        coded_str += '$fsn%i:%s' % (i, parser.get('motion_feed%02i' % i, 'feed_snap_interval'))
        coded_str += '$ffe%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_smovie_enabled')))
        coded_str += '$fme%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'feed_movie_enabled')))
        
        coded_str += '$psx%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_step_x'))
        coded_str += '$psy%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_step_y'))
        coded_str += '$ptt%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_track_type'))
        coded_str += '$pte%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'ptz_enabled')))
        coded_str += '$ptc%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'ptz_calib_first')))
        coded_str += '$pts%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_servo_settle'))
        coded_str += '$ppe%i:%s' % (i, bool_num(parser.get('motion_feed%02i' % i, 'ptz_park_enabled')))
        coded_str += '$ppd%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_park_delay'))
        coded_str += '$ppx%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_park_x'))
        coded_str += '$ppy%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_park_y'))
        coded_str += '$p1x%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset1_x'))
        coded_str += '$p1y%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset1_y'))
        coded_str += '$p2x%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset2_x'))
        coded_str += '$p2y%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset2_y'))
        coded_str += '$p3x%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset3_x'))
        coded_str += '$p3y%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset3_y'))
        coded_str += '$p4x%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset4_x'))
        coded_str += '$p4y%i:%s' % (i, parser.get('motion_feed%02i' % i, 'ptz_preset4_y'))
        coded_str += '$fne%i:%s' % (i, bool_num(parser.get('system', 'func_f%02i_enabled' % i)))
        
    
    for i in range(1, 9):
        
        coded_str += '$sex%i:%s' % (i, parser.get('schedule%i' % i, 'schedule_except'))
        coded_str += '$st1%i:%s' % (i, parser.get('schedule%i' % i, 'tline1'))
        coded_str += '$st2%i:%s' % (i, parser.get('schedule%i' % i, 'tline2'))
        coded_str += '$st3%i:%s' % (i, parser.get('schedule%i' % i, 'tline3'))
        coded_str += '$st4%i:%s' % (i, parser.get('schedule%i' % i, 'tline4'))
        coded_str += '$st5%i:%s' % (i, parser.get('schedule%i' % i, 'tline5'))
        coded_str += '$st6%i:%s' % (i, parser.get('schedule%i' % i, 'tline6'))
        coded_str += '$st7%i:%s' % (i, parser.get('schedule%i' % i, 'tline7'))
        
    for i in range(1, 5):
        
        coded_str += '$ed1%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline1_dates'))
        coded_str += '$ed2%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline2_dates'))
        coded_str += '$ed3%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline3_dates'))
        coded_str += '$ed4%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline4_dates'))
        coded_str += '$ed5%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline5_dates'))
        coded_str += '$ed6%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline6_dates'))
        coded_str += '$ed7%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline7_dates'))
        
        coded_str += '$et1%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline1'))
        coded_str += '$et2%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline2'))
        coded_str += '$et3%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline3'))
        coded_str += '$et4%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline4'))
        coded_str += '$et5%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline5'))
        coded_str += '$et6%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline6'))
        coded_str += '$et7%i:%s' % (i, parser.get('schedule_except%i' % i, 'tline7'))
    
    for i in range(1, 13):
        coded_str += '$dif%i:%s' % (i, parser.get('misc', 'misc4_display_feeds_%02i' % i))

    coded_str += '$col:%s' % parser.get('misc', 'misc4_color_select')
    coded_str += '$dis:%s' % parser.get('misc', 'misc4_display_select')
    coded_str += '$ver:%s' % parser.get('system', 'version')
    coded_str += '$vel:%s' % parser.get('system', 'version_latest')
    coded_str += '$msg:%s' % expand_chars(parser.get('system', 'msg'))
    
    coded_str += '$chk:%08i' % len(coded_str)
    return coded_str


def bool_num(bool_str):
    """
    Converts a 'true' or 'false' string to a 1 or 0.
    
    args    : bool_str ... a 'true' or 'false' string 
    excepts : 
    return  : 1 for 'true', 0 for 'false'
    """

    if bool_str == 'true': return 1
    return 0


def expand_chars(text):
    """
    Converts troublesome characters to <...>

    args    : text ... the text to be expand_charsd
    excepts : 
    return  : text ... the expand_charsd text
    """
    
    text = text.replace('&', '<amp>')
    text = text.replace('?', '<que>')
    text = text.replace(':', '<col>')
    return text


def mutex_acquire(kmotion_dir):
    """ 
    Aquire the 'www_rc' mutex lock, very carefully
    
    args    : kmotion_dir ... the 'root' dir of kmotion
    excepts : 
    return  : none
    """
    
    while True:
        # wait for any other locks to go
        while True:
            if check_lock(kmotion_dir) == 0:
                break
            time.sleep(0.01)
        
        # add our lock
        f_obj = open('%s/www/mutex/www_rc/%s' % (kmotion_dir, os.getpid()), 'w')
        print >> f_obj, ''
        f_obj.close()
            
        # wait ... see if another lock has appeared, if so remove our lock
        # and loop
        time.sleep(0.1)
        if check_lock(kmotion_dir) == 1:
            break
        os.remove('%s/www/mutex/www_rc/%s' % (kmotion_dir, os.getpid()))
        # random to avoid mexican stand-offs
        time.sleep(float(random.randint(01, 40)) / 1000)
            
        
def mutex_release(kmotion_dir):
    """ 
    Release the 'www_rc' mutex lock
    
    args    : kmotion_dir ... the 'root' dir of kmotion
    excepts : 
    return  : none
    """
    
    if os.path.isfile('%s/www/mutex/www_rc/%s' % (kmotion_dir, os.getpid())):
        os.remove('%s/www/mutex/www_rc/%s' % (kmotion_dir, os.getpid()))
       
        
def check_lock(kmotion_dir):
    """
    Return the number of active locks on the www_rc mutex, filters out .svn
    
    args    : kmotion_dir ... kmotions root dir
    excepts : 
    return  : num locks ... the number of active locks
    """
    
    files = os.listdir('%s/www/mutex/www_rc' % kmotion_dir)
    files.sort()
    if len(files) > 0 and files[0] == '.svn': # strip the .svn dir
        files.pop(0)
    return len(files)
        
        

# Module self test
class Test_Class(object):
        
    def __init__(self):
        self.filename = '../null/null'
    
if __name__ == '__main__':
    print '\nModule self test ...\n'
    print index(Test_Class())





