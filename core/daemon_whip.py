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
Controls kmotion daemons allowing daemon starting, stopping, checking of status
and config reloading
"""

import time, os, ConfigParser
from subprocess import *  # breaking habit of a lifetime !
import logger
from mutex_parsers import *
from init_core import InitCore
from kmotion_hkd1 import Kmotion_Hkd1
from kmotion_hkd2 import Kmotion_Hkd2
from kmotion_setd import Kmotion_setd

class DaemonControl:
    
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir):
        self.logger = logger.Logger('daemon_whip', DaemonControl.log_level)
        self.kmotion_dir = kmotion_dir
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.motion_reload_bug = parser.getboolean('workaround', 'motion_reload_bug')
        self.init_core = InitCore(self.kmotion_dir)

    def is_motion_running(self):
        p_objs = Popen('pgrep -f \'^motion.+-c.*\'', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
        return p_objs.stdout.readline() != ''

    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir):
            if not self.is_motion_running(): 
                self.init_core.init_motion_out()  # clear 'motion_out'
                Popen('while true; do test -z "$(pgrep -f \'^motion.+-c.*\')" -o -z "$(netstat -an | grep 8080)" && ( pkill -9 -f \'^motion.+-c.*\'; motion -c {0}/core/motion_conf/motion.conf 2>&1 | grep --line-buffered -v \'saved to\' >> {0}/www/motion_out & ); sleep 1; done &'.format(self.kmotion_dir), shell=True)
                self.logger.log('start_daemons() - starting motion', 'CRIT')
        else:
            self.logger.log('start_daemons() - no motion.conf, motion not started', 'CRIT') 
            
    def stop_motion(self):
        trys = 0
        while self.is_motion_running():
            trys += 1
            if trys < 20:
                Popen('pkill -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
                # Popen('killall -q motion', shell=True)
            else: 
                self.logger.log('reload_motion_config() - resorting to kill -9 ... ouch !', 'DEBUG')
                # Popen('killall -9 -q motion', shell=True) # if motion hangs get nasty !
                Popen('pkill -9 -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
            
            time.sleep(1)
            self.logger.log('reload_motion_config() - motion not killed - retrying ...', 'DEBUG')
            
        self.logger.log('stop_motion() - motion killed', 'DEBUG') 
        
    def get_kmotion_pids(self):
        p_objs = Popen('pgrep -f \'.*kmotion.py$\'', shell=True, stdout=PIPE, close_fds=True)
        return [pid for pid in p_objs.stdout.readlines() if int(pid) != os.getpid()]
        

    def start_daemons(self):
        """ 
        Check and start all the kmotion daemons
    
        args    : 
        excepts : 
        return  : none
        """ 
        
        self.logger.log('start_daemons() - starting daemons ...', 'DEBUG')
        
        Kmotion_Hkd1(self.kmotion_dir).start()
        Kmotion_Hkd2(self.kmotion_dir).start()
        Kmotion_setd(self.kmotion_dir).start()
        
#         p_objs = Popen('ps ax | grep kmotion_hkd1.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_hkd1.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True) 
#             self.logger.log('start_daemons() - starting kmotion_hkd1', 'DEBUG')
#     
#         p_objs = Popen('ps ax | grep kmotion_hkd2.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_hkd2.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_hkd2', 'DEBUG')
    
#         p_objs = Popen('ps ax | grep kmotion_fund.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_fund.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_fund', 'DEBUG')
            
#         p_objs = Popen('ps ax | grep kmotion_setd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':  
#             Popen('nohup %s/core/kmotion_setd.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_setd', 'DEBUG')
            
#         p_objs = Popen('ps ax | grep kmotion_ptzd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '': 
#             Popen('nohup %s/core/kmotion_ptzd.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_ptzd', 'DEBUG')
    
        self.start_motion()


    def kill_daemons(self):
        """ 
        Kill all the kmotion daemons 
    
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('kill_daemons() - killing daemons ...', 'DEBUG')
        
        # Popen('killall -q motion', shell=True)
        self.stop_motion()
        Popen('kill %s' % ' '.join(self.get_kmotion_pids()), shell=True).wait()
#         Popen('pkill -f \'python.+kmotion_hkd2.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_fund.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_setd.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_ptzd.py\'', shell=True)
#         # orderd thus because kmotion_hkd1.py needs to call this function  
#         Popen('pkill -f \'python.+kmotion_hkd1.py\'', shell=True)
#         
#         time.sleep(1) 
#         while self.is_daemons_running():
#             self.logger.log('kill_daemons() - resorting to kill -9 ... ouch !', 'DEBUG')
#             self.stop_motion()
#             Popen('pkill -9 -f \'python.+kmotion_hkd2.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_fund.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_setd.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_ptzd.py\'', shell=True)
#             # orderd thus because kmotion_hkd1.py needs to call this function  
#             Popen('pkill -9 -f \'python.+kmotion_hkd1.py\'', shell=True)
        
        # to kill off any 'cat' zombies ...
#         Popen('pkill -f \'cat.+/www/fifo_ptz\'', shell=True) 
#         Popen('pkill -f \'cat.+/www/fifo_ptz_preset\'', shell=True) 
#         Popen('pkill -f \'cat.+/www/fifo_func\'', shell=True) 
        Popen('pkill -f \'cat.+/www/fifo_settings_wr\'', shell=True)
            
        self.logger.log('kill_daemons() - daemons killed ...', 'DEBUG')


#     def is_daemons_running(self):
#         """ 
#         Check to see if all kmotion daemons are running
#     
#         args    : 
#         excepts : 
#         return  : bool ... true if all daemons are running
#         """
#         
#         p_objs = Popen('ps ax | grep kmotion_hkd1.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         stdout1 = p_objs.stdout.readline()
#         
#         p_objs = Popen('ps ax | grep kmotion_hkd2.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         stdout2 = p_objs.stdout.readline()
#             
# #         p_objs = Popen('ps ax | grep kmotion_fund.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
# #         stdout3 = p_objs.stdout.readline()
#         
#         p_objs = Popen('ps ax | grep kmotion_setd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         stdout4 = p_objs.stdout.readline()
#         
# #         p_objs = Popen('ps ax | grep kmotion_ptzd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
# #         stdout5 = p_objs.stdout.readline()
#         
#         return (stdout1 != '' and stdout2 != '' and stdout4 != '' and self.is_motion_running())


#     def reload_all_configs(self):
#         """ 
#         Force daemons to reload all configs 
#     
#         args    : 
#         excepts : 
#         return  : none
#         """
#         
# #         self.reload_ptz_config()
#         self.reload_motion_config()
#         # kmotion_fund and kmotion_setd have no SIGHUP handlers
#         Popen('pkill -SIGHUP -f python.+kmotion_hkd1.py', shell=True) 
#         Popen('pkill -SIGHUP -f python.+kmotion_hkd2.py', shell=True)
#        
#     
#     def reload_ptz_config(self):
#         """ 
#         Force ptz to reload configs 
#     
#         args    : 
#         excepts : 
#         return  : none
#         """
#         
#         # a workaround. because 'kmotion_ptzd' is threaded the only way
#         # to get the threads to reliably reload their config is to kill and 
#         # restart else they languish in a sleep state for ? secs. so sending 
#         # a SIGHUP to 'kmotion_ptzd' kills the script
#         Popen('pkill -SIGHUP -f python.+kmotion_ptzd.py', shell=True)  
#         while True:
#             p_objs = Popen('ps ax | grep kmotion_ptzd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#             stdout = p_objs.stdout.readline()
#             if stdout == '': break
#             time.sleep(0.1)
#         Popen('nohup %s/core/kmotion_ptzd.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
        
    

    
    def reload_motion_config(self):
        """ 
        Force motion to reload configs. The 'motion_reload_bug' flags whether a 
        SIGHUP is sufficient to reload motions configs or whether motion needs to be 
        stopped and restarted.
    
        Unfortunately motion appears not to look at its /dev/* files on receiving a 
        SIGHUP so a once connected device is assumed to be still there.
        
        args    : 
        excepts : 
        return  : none
        """
        
        self.init_core.init_motion_out()  # clear 'motion_out'
        if self.motion_reload_bug:  # motion_reload_bug workaround
            self.stop_motion()
            self.start_motion()
        else:        
            self.init_core.init_motion_out()  # clear 'motion_out'
            os.popen('killall -s SIGHUP motion')
            self.logger.log('reload_motion_configs() - motion sent SIGHUP signal', 'DEBUG')
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print kmotion_dir
    print DaemonControl(kmotion_dir).is_motion_running()
   
