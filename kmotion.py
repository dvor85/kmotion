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

import os, sys, time, threading, signal
from subprocess import *  # breaking habit of a lifetime !
from core.mutex_parsers import *
from core.www_logs import WWWLog
from core.motion_daemon import MotionDaemon
from core.init_core import InitCore 
import core.logger as logger
from core.kmotion_hkd1 import Kmotion_Hkd1
from core.kmotion_hkd2 import Kmotion_Hkd2
from core.kmotion_setd import Kmotion_setd
from core.kmotion_split import Kmotion_split


class exit_(Exception): pass

class Kmotion:
    
    log_level = 'DEBUG'
    
    def __init__(self, kmotion_dir, action):
        self.kmotion_dir = kmotion_dir
        self.action = action
        self.logger = logger.Logger('kmotion', Kmotion.log_level)
        signal.signal(signal.SIGTERM, self.signal_term)
        self.www_log = WWWLog(self.kmotion_dir)
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
         
        self.init_core = InitCore(self.kmotion_dir)
        self.motion_daemon = MotionDaemon(self.kmotion_dir)
        
    def start_daemons(self):
        """ 
        Check and start all the kmotion daemons
    
        args    : 
        excepts : 
        return  : none
        """ 
        
        self.logger.log('starting daemons ...', 'DEBUG')
        
        Kmotion_Hkd1(self.kmotion_dir).start()
        Kmotion_Hkd2(self.kmotion_dir).start()
        Kmotion_setd(self.kmotion_dir).start()        
        Kmotion_split(self.kmotion_dir).start()


    def kill_daemons(self):
        """ 
        Kill all the kmotion daemons 
    
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('killing daemons ...', 'DEBUG')
        
        # self.stop_motion()
        for pid in self.get_kmotion_pids():
            os.kill(int(pid), signal.SIGTERM) 
        while len(self.get_kmotion_pids()) > 0:
            time.sleep(1)
        self.logger.log('daemons killed ...', 'DEBUG')


    def main(self):
        """
        Re-initialises the kmotion core and reload the kmotion daemon configs
           
        args    : start|stop|reload on command line
        excepts : 
        return  : none
        """
        
        
        # if 'stop' shutdown and exit here
        if self.action == 'stop':
            self.logger.log('stopping kmotion ...', 'CRIT')
            self.kill_daemons()
            sys.exit()
        elif self.action == 'status':
            pids = self.get_kmotion_pids()
            if len(pids) > 0:
                print 'kmotion started with pids: ' + ' '.join(pids)
            else:
                print 'kmotion is not started'
            sys.exit()
        else:
            self.logger.log('starting kmotion ...', 'CRIT')
    
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
    
        self.init_core.set_uid_gid_named_pipes(os.getuid(), os.getgid())
        
        self.kill_daemons()
        self.start_daemons()        
        self.motion_daemon.start_motion()
              
        time.sleep(1)  # purge all fifo buffers, FIFO bug workaround :)
        
        purge_str = '#' * 1000 + '99999999'
        for fifo in ['fifo_settings_wr']:
            with open(os.path.join(self.kmotion_dir, 'www', fifo), 'w') as pipeout:
                pipeout.write(purge_str)
                
        for t in threading.enumerate():
            self.logger.log('thread %s is started' % t.getName(), 'DEBUG')
            
    def get_kmotion_pids(self):
        p_objs = Popen('pgrep -f ".*%s.*"' % os.path.basename(__file__), shell=True, stdout=PIPE)  
        stdout = p_objs.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
                
    def signal_term(self, signum, frame):
        self.www_log.add_shutdown_event()
        self.motion_daemon.stop_motion()
        sys.exit()
    
    def wait_termination(self):
        while True:      
            time.sleep(60 * 60 * 24)


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    kmotion = Kmotion(kmotion_dir, sys.argv[1])
    kmotion.main()
    kmotion.wait_termination()

