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
PT(Z) driver for axis 2130 network camera
"""

import os, urllib, cPickle, time
import logger

log_level = 'WARNING'
logger = logger.Logger('axis_2130', log_level)

URL_CGI_X = '/axis-cgi/com/ptz.cgi?camera=1&panbar=200&barcoord='
URL_CGI_Y = '/axis-cgi/com/ptz.cgi?camera=1&tiltbar=180&alignment=vertical&barcoord='

MIN_X, MAX_X = 1, 199
MIN_Y, MAX_Y = 1, 179

X_TIME, Y_TIME = 2, 2

        
def rel_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw, feed_x, feed_y, step_x, step_y):
    """
    Set the PT(Z) relative to the last position
    
    args    : feed, 
              feed_url, 
              feed_proxy, 
              feed_lgn_name, 
              feed_lgn_pw, 
              feed_x, 
              feed_y
    excepts : 
    return  : 
    """
    
    feed_y = -feed_y
    orig_x, orig_y = load_xy(feed)
    new_x = orig_x + feed_x
    new_y = orig_y + feed_y
    new_x, new_y = limit_xy(new_x, new_y)
    logger.log('rel_xy() - feed:%s, x:%s, y:%s' % (feed, new_x, new_y), 'DEBUG')
    set_xy(orig_x, orig_y, new_x, new_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw)
    save_xy(new_x, new_y, feed)
    
         
def abs_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw, feed_x, feed_y, step_x, step_y):
    """
    Set the PT(Z) absolutely to  position
    
    args    : feed, 
              feed_url, 
              feed_proxy, 
              feed_lgn_name, 
              feed_lgn_pw, 
              feed_x, 
              feed_y
    excepts : 
    return  : 
    """
    
    feed_y = -feed_y
    new_x, new_y = ((MAX_X - MIN_X)/2) + feed_x, ((MAX_Y - MIN_Y)/2) + feed_y
    new_x, new_y = limit_xy(new_x, new_y)
    logger.log('abs_xy() - feed:%s, x:%s, y:%s' % (feed, new_x, new_y), 'DEBUG')
    orig_x, orig_y = load_xy(feed)
    set_xy(orig_x, orig_y, new_x, new_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw)
    save_xy(new_x, new_y, feed)
    
    
def cal_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw, feed_x, feed_y, step_x, step_y):
    """
    Set the PT(Z) to the calibration position
    
    args    : feed, 
              feed_url, 
              feed_proxy, 
              feed_lgn_name, 
              feed_lgn_pw, 
              feed_x, 
              feed_y
    excepts : 
    return  : 
    """

    new_x, new_y = (MAX_X - MIN_X)/2, (MAX_Y - MIN_Y)/2
    logger.log('cal_xy() - feed:%s, x:%s, y:%s' % (feed, new_x, new_y), 'DEBUG')
    orig_x, orig_y = load_xy(feed)
    
    # guarantees X_TIME, Y_TIME to calibrate
    orig_x = new_x + (MAX_X - MIN_X)
    orig_y = new_y + (MAX_Y - MIN_Y)
    
    set_xy(orig_x, orig_y, new_x, new_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw)
    save_xy(new_x, new_y, feed)
    
    
def limit_xy(x, y):
    """
    Limit 'x', 'y' to within the min and max values
    
    args    : x, y
    excepts : 
    return  : x, y
    """
    
    x = max(min(x, MAX_X), MIN_X)
    y = max(min(y, MAX_Y), MIN_Y)
    return (x, y)
    

def set_xy(orig_x, orig_y, new_x, new_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw):
    """
    Move the camera - hopefully :)
    
    args    : x, y
              feed_url 
              feed_proxy    ... not used
              feed_lgn_name ... not used
              feed_lgn_pw   ... not used
    excepts : 
    return  : x, y
    """
      
    url = feed_url.split('/axis-cgi/')[0]  
    # add user name and password if supplied
    url_prot, url_body = url[:7], url[7:]
    
    if feed_lgn_name == '' or feed_lgn_pw == '':
        url_prot += ''  
    else:
        url_prot += '%s:%s@' % (feed_lgn_name, feed_lgn_pw)
    
    url = '%s%s' % (url_prot, url_body)
    
    f_obj = urllib.urlopen('%s%s?%s,10' % (url, URL_CGI_X, new_x))
    time.sleep((abs(new_x - orig_x) / float(MAX_X - MIN_X)) * X_TIME)
    f_obj.close()
    
    time.sleep(0.5)
    
    f_obj = urllib.urlopen('%s%s?10,%s' % (url, URL_CGI_Y, new_y))
    time.sleep((abs(new_y - orig_y) / float(MAX_Y - MIN_Y)) * Y_TIME)
    f_obj.close()

    
def save_xy(x, y, feed):
    """
    Save absolute 'x', 'y' as '<feed>xy'
    
    args    : x, y, feed
    excepts : 
    return  : 
    """
    
    f_obj = open('ptz_drivers/abs_xy/%02ixy' % feed, 'w')
    cPickle.dump([x, y], f_obj)
    f_obj.close()
    
    
def load_xy(feed):
    """
    Load saved absolute 'x', 'y' from '<feed>xy', default to mid position
    if none saved
    
    args    : feed
    excepts : 
    return  : x, y
    """
    
    if os.path.isfile('ptz_drivers/abs_xy/%02ixy' % feed):
        f_obj = open('ptz_drivers/abs_xy/%02ixy' % feed)
        data = cPickle.load(f_obj)
        f_obj.close()
    else:
        data = [(MAX_X - MIN_X)/2, (MAX_Y - MIN_Y)/2]
    return (data[0], data[1])
    
  





