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

import time, os, signal
from subprocess import *  # breaking habit of a lifetime !
import logger
from mutex_parsers import *
from init_core import InitCore
from kmotion_hkd1 import Kmotion_Hkd1
from kmotion_hkd2 import Kmotion_Hkd2
from kmotion_setd import Kmotion_setd
from kmotion_split import Kmotion_split

class DaemonControl:
    
    log_level = 'DEBUG'
    
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
        while True:
            trys += 1
            if trys < 20:
                Popen('pkill -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
            else: 
                self.logger.log('reload_motion_config() - resorting to kill -9 ... ouch !', 'DEBUG')
                Popen('pkill -9 -f \'.*motion.+-c.*\'', shell=True)  # if motion hangs get nasty !
                
            if not self.is_motion_running(): break
            time.sleep(1)
            
        self.logger.log('stop_motion() - motion killed', 'DEBUG') 
        
    def get_kmotion_pids(self):
        p_objs = Popen('pgrep -f \'.*kmotion.py.*\'', shell=True, stdout=PIPE)  
        stdout = p_objs.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
        

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
        Kmotion_split(self.kmotion_dir).start()
        self.start_motion()


    def kill_daemons(self):
        """ 
        Kill all the kmotion daemons 
    
        args    : 
        excepts : 
        return  : none
        """
        
        self.logger.log('kill_daemons() - killing daemons ...', 'DEBUG')
        
        self.stop_motion()
        for pid in self.get_kmotion_pids():
            os.kill(int(pid), signal.SIGTERM) 
        while len(self.get_kmotion_pids()) > 0:
            time.sleep(1)
        self.logger.log('kill_daemons() - daemons killed ...', 'DEBUG')
        
        
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
    print DaemonControl(kmotion_dir).get_kmotion_pids()
   
