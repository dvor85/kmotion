#!/usr/bin/env python
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

from subprocess import *  # breaking habit of a lifetime !
import ConfigParser
import time, os, signal

from init_core import InitCore
from kmotion_hkd1 import Kmotion_Hkd1
from kmotion_hkd2 import Kmotion_Hkd2
import logger


class DaemonControl:
    
    log_level = 'WARNING'
        
    def __init__(self, settings):
        self.settings = settings
        self.kmotion_dir = self.settings.get('DEFAULT', 'kmotion_dir')
        self.logger = logger.Logger('DaemonControl', DaemonControl.log_level)
        self.initCore = InitCore(self.settings)
        self.pid_file = os.path.join(self.kmotion_dir, 'kmotion.pid')
        if os.path.isfile(self.pid_file):
            with open(self.pid_file, 'r') as f_obj:
                self.pid = int(f_obj.read())
        else:
            self.pid = ''
        
               
        
        
    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir) and not self.is_motion_running():                
            self.initCore.init_motion_out()  # clear 'motion_out'
            Popen('while true; do test -z "$(pgrep -f \'^motion.+-c.*\')" -o -z "$(netstat -an | grep 8080)" && ( pkill -9 -f \'^motion.+-c.*\'; motion -c {0}/core/motion_conf/motion.conf 2>&1 | grep --line-buffered -v \'saved to\' >> {0}/www/motion_out & ); sleep 1; done &'.format(self.kmotion_dir), shell=True)
            self.logger.log('start_daemons() - starting motion', 'DEBUG')
        else:
            self.logger.log('start_daemons() - no motion.conf, motion not started', 'CRIT')
            
    def stop_motion(self):
        self.logger.log('kill_daemons() - killing daemons ...', 'DEBUG')        
        Popen('pkill -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
        
        while self.is_motion_running():
            self.logger.log('kill_daemons() - resorting to kill -9 ... ouch !', 'DEBUG')
            Popen('pkill -9 -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
            time.sleep(1)
        
    def is_motion_running(self):
        p_objs = Popen('/bin/ps ax | /bin/grep [m]otion\ -c', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
        stdout = p_objs.stdout.readline()
        return stdout != ''
        
    def start_daemons(self):
        """ 
        Check and start all the kmotion daemons
    
        args    : 
        excepts : 
        return  : none
        """ 
        
        self.logger.log('start_daemons() - starting daemons ...', 'DEBUG')
        
        
        self.hkd1 = Kmotion_Hkd1(self.settings)
        self.hkd2 = Kmotion_Hkd2(self.settings)
#         p_objs = Popen('ps ax | grep kmotion_hkd1.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_hkd1.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True) 
#             self.logger.log('start_daemons() - starting kmotion_hkd1', 'DEBUG')
    
#         p_objs = Popen('ps ax | grep kmotion_hkd2.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_hkd2.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_hkd2', 'DEBUG')
#     
#         p_objs = Popen('ps ax | grep kmotion_fund.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':   
#             Popen('nohup %s/core/kmotion_fund.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_fund', 'DEBUG')
#             
#         p_objs = Popen('ps ax | grep kmotion_setd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '':  
#             Popen('nohup %s/core/kmotion_setd.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_setd', 'DEBUG')
#             
#         p_objs = Popen('ps ax | grep kmotion_ptzd.py$', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
#         if p_objs.stdout.readline() == '': 
#             Popen('nohup %s/core/kmotion_ptzd.py >/dev/null 2>&1 &' % self.kmotion_dir, shell=True)
#             self.logger.log('start_daemons() - starting kmotion_ptzd', 'DEBUG')
        
        self.start_motion()
        
        with open(self.pid_file, 'w') as f_obj:
            f_obj.write(str(os.getpid()))


    def kill_daemons(self):
        """ 
        Kill all the kmotion daemons 
    
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('kill_daemons() - killing daemons ...', 'DEBUG')
        self.stop_motion()
        try:
            os.kill(self.pid, signal.SIGTERM)
        except:
            pass
        # Popen('kill -SIGTERM %s' % self.pid, shell=True)
#         Popen('pkill -f \'python.+kmotion_hkd2.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_fund.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_setd.py\'', shell=True)
#         Popen('pkill -f \'python.+kmotion_ptzd.py\'', shell=True)
#         # orderd thus because kmotion_hkd1.py needs to call this function  
#         Popen('pkill -f \'python.+kmotion_hkd1.py\'', shell=True)
        
        
        
        time.sleep(1) 
        while self.is_daemons_running():
            self.logger.log('kill_daemons() - resorting to kill -9 ... ouch !', 'DEBUG')
            # Popen('kill -SIGKILL %s' % self.pid, shell=True)
            try:
                os.kill(self.pid, signal.SIGKILL)
            except:
                pass
#             Popen('pkill -9 -f \'python.+kmotion_hkd2.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_fund.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_setd.py\'', shell=True)
#             Popen('pkill -9 -f \'python.+kmotion_ptzd.py\'', shell=True)
#             # orderd thus because kmotion_hkd1.py needs to call this function  
#             Popen('pkill -9 -f \'python.+kmotion_hkd1.py\'', shell=True)
            time.sleep(1)
        # to kill off any 'cat' zombies ...
        Popen('pkill -f \'cat.+/www/fifo_ptz\'', shell=True) 
        Popen('pkill -f \'cat.+/www/fifo_ptz_preset\'', shell=True) 
        Popen('pkill -f \'cat.+/www/fifo_settings_wr\'', shell=True) 
        Popen('pkill -f \'cat.+/www/fifo_func\'', shell=True) 
            
        self.logger.log('kill_daemons() - daemons killed ...', 'DEBUG')
        
        
        
    def is_kmotion_running(self):
        return self.pid != '' and os.path.isdir(os.path.join('/proc', str(self.pid))) 


    def is_daemons_running(self):
        """ 
        Check to see if all kmotion daemons are running
    
        args    : 
        excepts : 
        return  : bool ... true if all daemons are running
        """
        return (self.is_kmotion_running() and self.is_motion_running())


    def reload_all_configs(self):
        """ 
        Force daemons to reload all configs 
    
        args    : 
        excepts : 
        return  : none
        """
        
        self.reload_motion_config()
        # kmotion_fund and kmotion_setd have no SIGHUP handlers
        # Popen('kill -SIGHUP %s' % self.pid, shell=True) 
       
    
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
    
        self.initCore.init_motion_out()  # clear 'motion_out'
        self.stop_motion()
        self.start_motion()
        
           
      


