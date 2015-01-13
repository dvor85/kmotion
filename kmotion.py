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
Called by the kmotion exe file this module re-initialises the kmotion core then 
reloads the kmotion daemon configs

The kmotion exe file cannot call this code directly because it may be in a 
different working directory
"""

from subprocess import *  # breaking habit of a lifetime !
import ConfigParser
import time
import os, sys, signal, threading

from core.init_core import InitCore
from core.init_motion import InitMotion
import core.logger as logger
from core.daemon_control import DaemonControl
from core.kmotion_hkd1 import Kmotion_Hkd1
from core.www_logs import WWWLog




class exit_(Exception): pass

class Kmotion:
    
    log_level = 'WARNING' 
    
    
    def __init__(self,settings):
        signal.signal(signal.SIGTERM, self.signal_term)
        self.settings = settings
        self.logger = logger.Logger('kmotion', Kmotion.log_level)
        self.daemonControl = DaemonControl(self.settings)
        self.www_log = WWWLog(self.settings)
        self.initCore = InitCore(self.settings)
        self.initMotion = InitMotion(self.settings)

    def main(self, option):
        """
        Re-initialises the kmotion core and reload the kmotion daemon configs
           
        args    : start|stop|reload on command line
        excepts : 
        return  : none
        """
        
        # set kmotion_dir, remove /core from path    
            
        # if 'stop' shutdown and exit here
        if option == 'stop':
            self.logger.log('stopping kmotion ...', 'CRIT')
            self.daemonControl.kill_daemons()
            return
        
        elif option == 'start':
            self.logger.log('starting kmotion ...', 'CRIT')
        elif option == 'restart':
            self.logger.log('restarting kmotion ...', 'CRIT')
        
        if self.daemonControl.is_motion_running():
            self.logger.log('** CRITICAL ERROR ** kmotion failed to start ...', 'CRIT')
            self.logger.log('** CRITICAL ERROR ** Another instance of motion daemon has been detected', 'CRIT')
            raise exit_("""An instance of the motion daemon has been detected which is not under control 
                            of kmotion. Please kill this instance and ensure that motion is not started
                            automatically on system bootup. This a known problem with Ubuntu 8.04 
                            Reference Bug #235599.""")
    
        
        # init the ramdisk dir
        self.initCore.init_ramdisk_dir()
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.initCore.update_rcs()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'settings.cfg\' : %s' % (sys.exc_info()[1]))
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.initCore.gen_vhost()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'settings.cfg\' : %s' % (sys.exc_info()[1]))
    
        # init motion_conf directory with motion.conf, thread1.conf ...
        self.initMotion.gen_motion_configs()
        
        # speed kmotion startup
        if not self.daemonControl.is_daemons_running():
            self.daemonControl.start_daemons()
        else:
            self.daemonControl.reload_all_configs()
              
        time.sleep(1)  # purge all fifo buffers, FIFO bug workaround :)
        purge_str = '#' * 1000 + '99999999'
        
#         for fifo in ['fifo_settings_wr']:        
#             with os.open('%s/www/%s' % (kmotion_dir, fifo), os.O_WRONLY) as pipeout:
#                 os.write(pipeout, purge_str)                
        
            
    def signal_term(self,signum, frame):
        self.www_log.add_shutdown_event()
        for t in threading.enumerate():
            if t != threading.currentThread():
                t.stop()
    
    def wait_terminate(self):
        running = True
        while running:
            running = False
            for t in threading.enumerate():
                if t != threading.currentThread():
                    running = running or t.is_alive()
            time.sleep(1)
    

if __name__ == '__main__':
    
    kmotion_dir = os.path.dirname(__file__)    
    settings = ConfigParser.SafeConfigParser()
    settings.read(os.path.join(kmotion_dir,'settings.cfg'))
    settings.set('DEFAULT', 'kmotion_dir', kmotion_dir)
    
    kmotion = Kmotion(settings)
    kmotion.main(sys.argv[1])
    kmotion.wait_terminate()
    
    
    
    
   


