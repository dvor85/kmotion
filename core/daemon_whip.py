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
        
        #self.stop_motion()
        for pid in self.get_kmotion_pids():
            os.kill(int(pid), signal.SIGTERM) 
        while len(self.get_kmotion_pids()) > 0:
            time.sleep(1)
        self.logger.log('daemons killed ...', 'DEBUG')
        
        
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print kmotion_dir
    print DaemonControl(kmotion_dir).get_kmotion_pids()
   
