#!/usr/bin/env python

# Copyright 2008 David Selby dave6502@googlemail.com

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
Waits on the 'fifo_ptz' fifo until data received
"""

import sys, threading, subprocess, time, os.path, urllib, time, signal, ConfigParser, traceback
import logger
from mutex_parsers import *
import ptz_drivers.axis_2130 as axis_2130
import ptz_drivers.axis_213 as axis_213
import ptz_drivers.panasonic as panasonic
import ptz_drivers.foscam as foscam


log_level = 'WARNING'
logger = logger.Logger('kmotion_ptzd', log_level)
X, Y = 0, 1

# global config variables for threads

kmotion_dir = os.getcwd()[:-5]
    
# mutex for every feed to avoid cross locking
mutex_feed = [threading.Lock() for i in range(17)]

# time of last change to ptz. If zero PTZ has been parked
# if non zero the clock to park is running :)
ptz_last_change = [1 for i in range(17)]

# calibrate before moving to abs position
ptz_calib_first = [False for i in range(17)]

# plugin data
feed_enabled = [False for i in range(17)]
feed_url = ['' for i in range(17)]
feed_proxy = ['' for i in range(17)]
feed_lgn_name = ['' for i in range(17)]
feed_lgn_pw = ['' for i in range(17)]

# enables, track type, step and delay values
ptz_enabled = [False for i in range(17)]
ptz_park_enabled = [False for i in range(17)]
ptz_track_type = [0 for i in range(17)]
ptz_servo_settle = [0 for i in range(17)]
ptz_park_delay = [0 for i in range(17)]

# x y coordinates
ptz_step = [[0, 0] for i in range(17)]
ptz_park = [[0, 0] for i in range(17)]
ptz_preset1 = [[0, 0] for i in range(17)]
ptz_preset2 = [[0, 0] for i in range(17)]
ptz_preset3 = [[0, 0] for i in range(17)]
ptz_preset4 = [[0, 0] for i in range(17)]


def read_config():
    """
    Read config from www_rc.

    args    :
    excepts : 
    return  : none
    """

     
    parser = mutex_www_parser_rd(kmotion_dir)
       
    
    for feed in range(1, 17):

        feed_enabled[feed] = parser.getboolean('motion_feed%02i' % feed, 'feed_enabled')
        feed_url[feed] = parser.get('motion_feed%02i' % feed, 'feed_url')
        feed_proxy[feed] = parser.get('motion_feed%02i' % feed, 'feed_proxy')
        feed_lgn_name[feed] = parser.get('motion_feed%02i' % feed, 'feed_lgn_name')
        feed_lgn_pw[feed] = parser.get('motion_feed%02i' % feed, 'feed_lgn_pw')
        
        ptz_enabled[feed] = parser.getboolean('motion_feed%02i' % feed, 'ptz_enabled')
        ptz_track_type[feed] = int(parser.get('motion_feed%02i' % feed, 'ptz_track_type'))
        ptz_park_enabled[feed] = parser.getboolean('motion_feed%02i' % feed, 'ptz_park_enabled')
        ptz_calib_first[feed] = parser.getboolean('motion_feed%02i' % feed, 'ptz_calib_first')
        ptz_park_delay[feed] = int(parser.get('motion_feed%02i' % feed, 'ptz_park_delay'))

        ptz_step[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_step_x'))
        ptz_step[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_step_y'))
        ptz_park[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_park_x'))
        ptz_park[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_park_y'))

        ptz_preset1[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset1_x'))
        ptz_preset1[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset1_y'))
        ptz_preset2[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset2_x'))
        ptz_preset2[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset2_y'))
        ptz_preset3[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset3_x'))
        ptz_preset3[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset3_y'))
        ptz_preset4[feed][X] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset4_x'))
        ptz_preset4[feed][Y] = int(parser.get('motion_feed%02i' % feed, 'ptz_preset4_y'))


def main():
    logger.log('starting daemon ...', 'CRIT')
    signal.signal(signal.SIGHUP, signal_hup)
    read_config()
    thread1 = Thread1_PTZ()
    thread1.setDaemon(True)
    thread1.start()
    thread2 = Thread2_PTZ_Park()
    thread2.setDaemon(True)
    thread2.start()
    thread3 = Thread3_PTZ_Preset()
    thread3.setDaemon(True)
    thread3.start()

    while True:  # sleep to keep daemons to live :)
        time.sleep(60 * 60 * 24)


def signal_hup(signum, frame):
    """ 
    SIGHUP, unlike all other daemons SIGHUP causes this daemon to exit killing
    all its daemon threads. This is a workaround. Because 'kmotion_ptzd' is 
    threaded the only way to get the threads to reliably reload their config 
    is to kill and restart else they languish in a sleep state for ? secs. 

    args    : discarded
    excepts : 
    return  : none
    """
    
    logger.log('signal SIGHUP detected, shutting down due to threading', 'CRIT')
    sys.exit()


class Servo_Control:

    def set_ptz_rel(self, feed, x, y):
        """
        Set the ptz in relative mode

        args    : feed, x, y
        excepts : 
        return  : none
        """

        logger.log('set_ptz_rel() - feed:%s, x:%s, y:%s' % (feed, x, y), 'DEBUG')
        driver = ptz_track_type[feed]
        if driver < 9:  # use motion to move cameras
            try:
                obj = urllib.urlopen('http://localhost:8080/%s/track/set?pan=%s&tilt=%s' % (feed, x, y))
                obj.readlines()
                obj.close()
            except IOError:
                pass
        
        elif driver == 9:  # use 'axis_213' driver
            axis_213.rel_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 10:  # use 'axis_2130' driver
            axis_2130.rel_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 11:  # use 'panasonic' driver
            panasonic.rel_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 12:  # use 'foscam' driver
            foscam.rel_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
            
    def set_ptz_abs(self, feed, x, y):
        """
        Set the ptz in absolute mode

        args    : feed, x, y
        excepts : 
        return  : none
        """
        
        logger.log('set_ptz_abs() - feed:%s, x:%s, y:%s' % (feed, x, y), 'DEBUG')
        driver = ptz_track_type[feed]
        if driver < 9:  # use motion to move cameras
            try:
                obj = urllib.urlopen('http://localhost:8080/%s/track/set?x=%s&y=%s' % (feed, x, y))
                obj.readlines()
                obj.close()
            except IOError:
                pass
            
        elif driver == 9:  # use 'axis_213' driver
            axis_213.abs_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 10:  # use 'axis_2130' driver
            axis_2130.abs_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 11:  # use 'panasonic' driver
            panasonic.abs_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 12:  # use 'foscam' driver
            foscam.abs_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], x, y, ptz_step[feed][X], ptz_step[feed][Y])
            

    def recalibrate_ptz(self, feed):
        """  
        Recalibrate the ptz 

        args    : feed
        excepts : 
        return  : none
        """
        
        logger.log('recalibrate_ptz() - recalibrate', 'DEBUG')
        driver = ptz_track_type[feed]
        
        if driver < 9:  # use motion to move cameras
            # ref ... http://www.lavrsen.dk/twiki/bin/view/Motion/LogitechSphereControl
            self.set_ptz_abs(feed, -69, 24)
            time.sleep(2)
            self.set_ptz_abs(feed, 69, -29)
            time.sleep(2)
            self.set_ptz_abs(feed, 0, 0)
            
        elif driver == 9:  # use 'axis_213' driver
            axis_213.cal_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], 0, 0, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 10:  # use 'axis_2130' driver
            axis_2130.cal_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], 0, 0, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 11:  # use 'panasonic' driver
            panasonic.cal_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], 0, 0, ptz_step[feed][X], ptz_step[feed][Y])
            
        elif driver == 12:  # use 'foscam' driver
            foscam.cal_xy(feed, feed_url[feed], feed_proxy[feed], feed_lgn_name[feed], feed_lgn_pw[feed], 0, 0, ptz_step[feed][X], ptz_step[feed][Y])
            
                
    def inc_servo_counter(self, kmotion_dir):
        """
        Increments the count of the file 'servo_state'. Used to indicate the
    servos have completed a positional change.
        """

        obj = open('%s/www/servo_state' % kmotion_dir, 'r+')
        count = int(obj.read())
        count += 1
        count %= 9
        obj.seek(0)
        obj.write(str(count))
        obj.close()
        
           
class Thread1_PTZ(Servo_Control, threading.Thread):

    def run(self):  
        """
        Waits on the 'fifo_ptz' fifo until data received, checks its integrity 
        and moves the camera.

        args    : 
        excepts : 
        return  : none
        """
        
        logger.log('thread1_PTZ() - thread starting ...', 'DEBUG')
        enabled_list = [i for i in range(17) if ptz_enabled[i]]
        logger.log('enabled :%s' % enabled_list, 'DEBUG')
        kmotion_dir = os.getcwd()[:-5]
        ptz_history = []
        
        try:
            # calibrate all cameras after daemon start
            for feed in [j for j in range(1, 17) if ptz_enabled[j]]:
                self.recalibrate_ptz(feed)
                
            while True:

                logger.log('waiting on FIFO pipe data', 'DEBUG')
                data = subprocess.Popen(['cat', '%s/www/fifo_ptz' % kmotion_dir], stdout=subprocess.PIPE).communicate()[0]
                data = data.rstrip()
                logger.log('FIFO pipe data: %s' % data, 'DEBUG')
                
                if len(data) < 8:
                    continue
        
                if len(data) > 7 and data[-8:] == '99999999':  # FIFO purge
                    logger.log('FIFO purge', 'DEBUG')
                    continue
                
                # if no enabled feeds, still open 'pipein' to avoid lockup on
                # far end of pipe.
                if enabled_list == []: continue
                
                # check for coded format 'caf<feed 2 digit + 5000>x<4 digits>y<4 digits + 5000>$' 
                # camera absolute
                if len(data) > 15 and data[-16:-13] == 'caf' and data[-11] == 'x' and data[-6] == 'y' and data[-1] == '$':
                    feed, x, y = int(data[-13:-11]), int(data[-10:-6]) - 5000, int(data[-5:-1]) - 5000
                    ptz_last_change[feed] = time.time()
                    mutex_feed[feed].acquire()
                    
                    if ptz_calib_first[feed]:
                        self.recalibrate_ptz(feed)

                    self.set_ptz_abs(feed, x, y)
                    mutex_feed[feed].release()
                    self.inc_servo_counter(kmotion_dir)
                    continue
                
                # check for coded format crf<feed 2 digit>b<button 2 digit>$ camera relative
                if len(data) > 8 and data[-9:-6] == 'crf' and data[-4] == 'b' and data[-1] == '$':
                    feed, button = int(data[-6:-4]), int(data[-3:-1])
                    ptz_last_change[feed] = time.time()
                    mutex_feed[feed].acquire()
                    
                    if button == 1:
                        ptz_history.append(1)
                        self.set_ptz_rel(feed, -ptz_step[feed][X], 0)
    
                    elif button == 2:
                        ptz_history.append(2)
                        self.set_ptz_rel(feed, 0, ptz_step[feed][Y])
    
                    elif button == 3:
                        ptz_history.append(3)
                        self.set_ptz_rel(feed, 0, -ptz_step[feed][Y])
    
                    else:  # ie == 4
                        ptz_history.append(4)
                        self.set_ptz_rel(feed, ptz_step[feed][X], 0)
    
                    ptz_last_change[feed] = time.time()
                    ptz_history = ptz_history[-4:]
                    if ptz_history == [1, 2, 3, 4]:
                        self.recalibrate_ptz(feed)
    
                    mutex_feed[feed].release()
                    self.inc_servo_counter(kmotion_dir)
            
        except:           
            exc_type, exc_value, exc_traceback = sys.exc_info()
            exc_trace = traceback.extract_tb(exc_traceback)[-1]
            exc_loc1 = '%s' % exc_trace[0]
            exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
            
            logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread1_PTZ  crash - type: %s' 
                       % exc_type, 'CRIT')
            logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread1_PTZ  crash - value: %s' 
                       % exc_value, 'CRIT')
            logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread1_PTZ  crash - traceback: %s' 
                       % exc_loc1, 'CRIT')
            logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread1_PTZ  crash - traceback: %s' 
                       % exc_loc2, 'CRIT')
            time.sleep(5)


class Thread2_PTZ_Park(Servo_Control, threading.Thread):

    def run(self):  
        """
        Park the PTZ after a predefined period of inactivity

        args    : 
        excepts : 
        return  : none
        """

        logger.log('thread2_PTZ_Park() - thread starting ...', 'DEBUG')
        
        feed_enabled_list = [i for i in range(17) if feed_enabled[i]]
        ptz_enabled_list = [i for i in range(17) if ptz_enabled[i]]
        ptz_park_enabled_list = [i for i in range(17) if ptz_park_enabled[i]]
        enabled_list = list(set(feed_enabled_list) & set(ptz_enabled_list) & set(ptz_park_enabled_list))
        if enabled_list == []: 
            return
        
        for feed in enabled_list:  # init timers so no parking at startup
            ptz_last_change[feed] = time.time()
            
        while True:

            try:
                # park the PTZ if its been inactive for more than 'ptz_park_delay'
                for feed in enabled_list:
                    if ((time.time() - ptz_last_change[feed]) > ptz_park_delay[feed] 
                        and ptz_last_change[feed] != 0):
                        ptz_last_change[feed] = 0
                        logger.log('thread2_PTZ_Park() - parking feed: %s' % feed, 'DEBUG')
                        mutex_feed[feed].acquire()

                        if ptz_calib_first[feed]:
                            self.recalibrate_ptz(feed)

                        self.set_ptz_abs(feed, ptz_park[feed][X], ptz_park[feed][Y])
                        mutex_feed[feed].release()

                # calculate the sleep time, more complex than you might think !
                # find the min time left before any park happens ...
                sleep = 60 * 60 * 24
                ptzs_ticking = [i for i in enabled_list if ptz_last_change[i] != 0]
                if len(ptzs_ticking) == 0:  
                    # sleep for the min 'ptz_park_delay'
                    for feed in enabled_list:
                        sleep = min(sleep, ptz_park_delay[feed])

                else:
                    for feed in enabled_list:
                        wait = ptz_park_delay[feed] - (time.time() - ptz_last_change[feed]) 
                        sleep = min(sleep, wait)
                    sleep = max(0, sleep)  # catch any neg edge conditions

                logger.log('thread2_PTZ_Park() - sleeping for %s secs' % (sleep), 'DEBUG')
                time.sleep(sleep)

            except:               
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread2_PTZ_park  crash - type: %s' 
                           % exc_type, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread2_PTZ_park  crash - value: %s' 
                           % exc_value, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread2_PTZ_park  crash - traceback: %s' 
                           % exc_loc1, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread2_PTZ_park  crash - traceback: %s' 
                           % exc_loc2, 'CRIT')
                time.sleep(5)
                

class Thread3_PTZ_Preset(Servo_Control, threading.Thread):

    def run(self):
        """
        Waits on the 'fifo_ptz_preset' fifo until data received, checks its 
        integrity and moves the camera

        args    : 
        excepts : 
        return  : none
        """

        logger.log('thread3_PTZ_Preset() - thread starting ...', 'DEBUG')
        kmotion_dir = os.getcwd()[:-5]
        enabled_list = [i for i in range(17) if ptz_enabled[i]]

        while True: 

            try:
                # coded format f<2 digit'>p<feed 1 digit>#
                logger.log('waiting on FIFO pipe data', 'DEBUG')
                data = subprocess.Popen(['cat', '%s/www/fifo_ptz_preset' % kmotion_dir], stdout=subprocess.PIPE).communicate()[0]
                data = data.rstrip()
                logger.log('FIFO pipe data: %s' % data, 'DEBUG')
                
                if len(data) < 8:
                    continue
        
                if len(data) > 7 and data[-8:] == '99999999':  # FIFO purge
                    logger.log('FIFO purge', 'DEBUG')
                    continue

                # if no enabled feeds, still open 'pipein' to avoid lockup on
                # far end of pipe.
                if enabled_list == []: continue

                if len(data) > 5 and data[-6] == 'f' and data[-3] == 'p' and data[-1] == '#':
                    feed, preset = int(data[-5:-3]), int(data[-2])
                    data = ''
                    
                    if ptz_enabled[feed]: 
                        logger.log('thread3_PTZ_Preset() - activating feed: %s preset: %s' % (feed, preset), 'CRIT')
                        mutex_feed[feed].acquire()
                        
                        if ptz_calib_first[feed]:
                            self.recalibrate_ptz(feed)

                        if preset == 1:
                            self.set_ptz_abs(feed, ptz_preset1[feed][X], ptz_preset1[feed][Y])
                        elif preset == 2:
                            self.set_ptz_abs(feed, ptz_preset2[feed][X], ptz_preset2[feed][Y])
                        elif preset == 3:
                            self.set_ptz_abs(feed, ptz_preset3[feed][X], ptz_preset3[feed][Y])
                        else:
                            self.set_ptz_abs(feed, ptz_preset4[feed][X], ptz_preset4[feed][Y])
                        mutex_feed[feed].release()
                        ptz_last_change[feed] = time.time()

            except:     
                exc_type, exc_value, exc_traceback = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_traceback)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread3_PTZ_preset  crash - type: %s' 
                           % exc_type, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread3_PTZ_preset  crash - value: %s' 
                           % exc_value, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread3_PTZ_preset  crash - traceback: %s' 
                           % exc_loc1, 'CRIT')
                logger.log('** CRITICAL ERROR ** kmotion_ptzd Thread3_PTZ_preset  crash - traceback: %s' 
                           % exc_loc2, 'CRIT')
                time.sleep(60)


                
if __name__ == '__main__':
    main()






