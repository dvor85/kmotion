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
Called by the kmotion exe file this module re-initialises the kmotion core then 
reloads the kmotion daemon configs

The kmotion exe file cannot call this code directly because it may be in a 
different working directory
"""

import os, sys, time
from subprocess import *  # breaking habit of a lifetime !
from core.init_core import InitCore 
from core.init_motion import InitMotion
import core.logger as logger
from core.mutex_parsers import *
from core.daemon_whip import DaemonControl
import signal
from core.www_logs import WWWLog
import threading


log_level = 'WARNING' 
logger = logger.Logger('kmotion', log_level)

class exit_(Exception): pass

class Kmotion:
    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        signal.signal(signal.SIGTERM, self.signal_term)
        self.www_log = WWWLog(self.kmotion_dir)
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
         
        self.daemon_whip = DaemonControl(self.kmotion_dir)
        self.init_core = InitCore(self.kmotion_dir)
        self.init_motion = InitMotion(self.kmotion_dir)


    def main(self, option):
        """
        Re-initialises the kmotion core and reload the kmotion daemon configs
           
        args    : start|stop|reload on command line
        excepts : 
        return  : none
        """
        
           
        
        
        # if 'stop' shutdown and exit here
        if option == 'stop':
            logger.log('stopping kmotion ...', 'CRIT')
            self.daemon_whip.kill_daemons()
            return
        
        elif option == 'start':
            logger.log('starting kmotion ...', 'CRIT')
        elif option == 'restart':
            logger.log('restarting kmotion ...', 'CRIT')
        # check for any invalid motion processes
        
        if self.daemon_whip.is_motion_running():
            logger.log('** CRITICAL ERROR ** kmotion failed to start ...', 'CRIT')
            logger.log('** CRITICAL ERROR ** Another instance of motion daemon has been detected', 'CRIT')
            raise exit_("""An instance of the motion daemon has been detected which is not under control 
    of kmotion. Please kill this instance and ensure that motion is not started
    automatically on system bootup. This a known problem with Ubuntu 8.04 
    Reference Bug #235599.""")
    
        # init the ramdisk dir
        self.init_core.init_ramdisk_dir()
        
        
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.init_core.update_rcs()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.init_core.gen_vhost()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
    
        # init motion_conf directory with motion.conf, thread1.conf ...
        self.init_motion.gen_motion_configs()
        
        # speed kmotion startup
#         if not self.daemon_whip.is_daemons_running():
#             self.daemon_whip.start_daemons()
#         else:
        self.daemon_whip.kill_daemons()
        self.daemon_whip.start_daemons()
#            self.daemon_whip.reload_all_configs()
              
        time.sleep(1)  # purge all fifo buffers, FIFO bug workaround :)
        purge_str = '#' * 1000 + '99999999'
        for fifo in ['fifo_settings_wr']:
            pipeout = os.open('%s/www/%s' % (self.kmotion_dir, fifo), os.O_WRONLY)
            os.write(pipeout, purge_str)
            os.close(pipeout)
            
    def signal_term(self, signum, frame):
        self.www_log.add_shutdown_event()
        self.daemon_whip.kill_daemons()
        sys.exit()
    
    def wait_termination(self):
        while True:            
            time.sleep(60 * 60 * 24)
            



if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    kmotion = Kmotion(kmotion_dir)
    kmotion.main(sys.argv[1])
    kmotion.wait_termination()

