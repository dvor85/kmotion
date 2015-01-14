#!/usr/bin/env python

# Copyright 2008, 2010 David Selby dave6502@googlemail.com, Dominique Perrodon
# dominique.perrodon@gmail.com

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
PT(Z) driver for FOSCAM FI8908W

It's a modification of the Panasonic driver.
-It use '&onestep=1' to be more accurate
-video.cgi or videostream.cgi can be used
-The MIN_X, MAX_X, MIN_Y and MAX_Y have been introduced to avoid
problems with moving outside the possibilities
and then resulting in loosing the calibration
- use speedy calibration (with max speed rotation see ptz_patrol_rate)
and with command=92 (the calibration position is now
max down/max left).
Now to reach max up, we have 23 steps (23*15=345=MAX_Y).
To reach max right we have 58 steps (58*75=870=MAX_X).

note : IT IS HIGHLY RECOMMANDED TO ISSUE '/set_misc.cgi?
ptz_patrol_rate=0' TO AVOID PROBLEMS OF OVERLAPPING COMMANDS
(issue a new command but the camera's  motors do not have finish their
job)
It can be easly added in the calibration code but don't like to modify
permanently the camera parameters without user agreement/knowledge
So uncomment where stated to do it)
"""

import os, urllib, cPickle, time
import core.logger as logger

log_level = 'DEBUG'
logger = logger.Logger('foscam', log_level)
URL_CGI_PLUS_X =  '/decoder_control.cgi?command=6&onestep=1'
URL_CGI_MINUS_X = '/decoder_control.cgi?command=4&onestep=1'
URL_CGI_PLUS_Y =  '/decoder_control.cgi?command=0&onestep=1'
URL_CGI_MINUS_Y = '/decoder_control.cgi?command=2&onestep=1'
URL_CGI_CALIB =   '/decoder_control.cgi?command=92'
# uncomment to speed up motors
#URL_CGI_CALIB2 =   '/set_misc.cgi?ptz_patrol_rate=0' 

MIN_X=0
MAX_X=870
MIN_Y=0
MAX_Y=345

def rel_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw,
feed_x, feed_y, step_x, step_y):
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

    current_x, current_y, step_x, step_y = load_xy_step_xy(feed)

    # grab 'feed_x', 'feed_y' values as step values, a workaround
    if feed_x != 0:
        step_x = abs(feed_x)

    elif feed_y != 0:
        step_y = abs(feed_y)

    new_x = current_x + feed_x
    new_y = current_y + feed_y

    # we are going to see if we can do the move
    if new_x < MIN_X:
        new_x = MIN_X
    elif new_x > MAX_X:
        new_x = MAX_X

    if new_y < MIN_Y:
        new_y = MIN_Y
    elif new_y > MAX_Y:
        new_y = MAX_Y

    move_rel_xy(feed, current_x, current_y, new_x, new_y, step_x,
step_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw)
    logger.log('rel_xy() - feed:%s, x:%s, y:%s' % (feed, new_x,
new_y), 'DEBUG')
    save_xy_step_xy(feed, new_x, new_y, step_x, step_y)


def abs_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw,
feed_x, feed_y, step_x, step_y):
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

    logger.log('abs_xy() - feed:%s, x:%s, y:%s' % (feed, feed_x,
feed_y), 'DEBUG')

    current_x, current_y, step_x, step_y = load_xy_step_xy(feed)
    move_rel_xy(feed, current_x, current_y, feed_x, feed_y, step_x,
step_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw)
    save_xy_step_xy(feed, feed_x, feed_y, step_x, step_y)


def cal_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw,
feed_x, feed_y, step_x, step_y):
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

    logger.log('cal_xy() - feed:%s, x:%s, y:%s' % (feed, feed_x,
feed_y), 'DEBUG')

# uncomment to speed up motors
#    touch_url(feed_url, URL_CGI_CALIB2, feed_proxy, feed_lgn_name, feed_lgn_pw)
    touch_url(feed_url, URL_CGI_CALIB, feed_proxy, feed_lgn_name,
feed_lgn_pw)
    current_x, current_y, step_x, step_y = load_xy_step_xy(feed)
    save_xy_step_xy(feed, 0, 0, step_x, step_y)

    
def move_rel_xy(feed, current_x, current_y, new_x, new_y, step_x,
step_y, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw):
    """
    Move the camera - hopefully :)

    args    : feed,
              current_x,
              current_y,
              new_x,
              new_y,
              step_x,
              step_y,
              feed_url,
              feed_proxy,
              feed_lgn_name,
              feed_lgn_pw
    excepts :
    return  :
    """

    # speed-up return to 0,0 doing the calibration
    if new_x == 0 and new_y == 0 and (new_x != current_x or new_y !=
current_y):
        cal_xy(feed, feed_url, feed_proxy, feed_lgn_name, feed_lgn_pw,
new_x, new_y, step_x, step_y)
        return


    if new_x > current_x:
        for i in range(int((new_x - current_x) / step_x)):
            touch_url(feed_url, URL_CGI_PLUS_X, feed_proxy,
feed_lgn_name, feed_lgn_pw)
    elif new_x < current_x:
        for i in range(int((current_x - new_x) / step_x)):
            touch_url(feed_url, URL_CGI_MINUS_X, feed_proxy,
feed_lgn_name, feed_lgn_pw)

    if new_y > current_y:
        for i in range(int((new_y - current_y) / step_y)):
            touch_url(feed_url, URL_CGI_PLUS_Y, feed_proxy,
feed_lgn_name, feed_lgn_pw)
    elif new_y < current_y:
        for i in range(int((current_y - new_y) / step_y)):
            touch_url(feed_url, URL_CGI_MINUS_Y, feed_proxy,
feed_lgn_name, feed_lgn_pw)

            
def touch_url(feed_url, cgi_url, feed_proxy, feed_lgn_name,
feed_lgn_pw):
    """
    Touch the URL created by merging 'feed_url, and 'cgi_url'

    args    : feed_url,
              cgi_url,
              feed_proxy,
              feed_lgn_name,
              feed_lgn_pw
    excepts :
    return  :
    """

    base_url = feed_url.split('/video.cgi')[0]

    # trying to be more independent to find the base_url
    start=feed_url.find('/videostream.cgi')
    if start != -1:
        base_url = feed_url.split('/videostream.cgi')[0]

    # add user name and password if supplied
    url_prot, url_body = base_url[:7], base_url[7:]
    if  feed_lgn_name != '' and feed_lgn_pw != '':
        url_prot += '%s:%s@' % (feed_lgn_name, feed_lgn_pw)
    base_url = '%s%s' % (url_prot, url_body)

    logger.log('touch_url() - %s%s' % (base_url, cgi_url), 'DEBUG')
    f_obj = urllib.urlopen('%s%s' % (base_url, cgi_url))

    time.sleep(0.5)
    f_obj.close()


def save_xy_step_xy(feed, x, y, step_x, step_y):
    """
    Save absolute 'x', 'y' and 'step_x', 'step_y' as '<feed>xy'

    args    : feed,
              x, y,
              step_x,
              step_y
    excepts :
    return  :
    """

    f_obj = open('ptz_drivers/abs_xy/%02ixy' % feed, 'w')
    cPickle.dump([x, y, step_x, step_y], f_obj)
    f_obj.close()

    
def load_xy_step_xy(feed):
    """
    Load saved absolute 'x', 'y' and 'step_x', 'step_y' from '<feed>xy',
    default to zeros if none saved

    args    : feed
    excepts :
    return  : x, y, step_x, step_y
    """

    data = [0, 0, 0, 0]
    if os.path.isfile('ptz_drivers/abs_xy/%02ixy' % feed):
        f_obj = open('ptz_drivers/abs_xy/%02ixy' % feed)
        data = cPickle.load(f_obj)
        f_obj.close()

    if len(data) != 4:
        data = [0, 0, 0, 0]

    return (data[0], data[1], data[2], data[3])

