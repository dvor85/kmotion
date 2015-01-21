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
Creates the appropreate file in 'ramdisk_dir/events' and execute the
appropreate script in 'event' if it exists.
"""

import os, sys, subprocess, time
import logger
from mutex_parsers import *



class EventStart:
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir, thread):        
        self.logger = logger.Logger('event_start', EventStart.log_level)
        self.kmotion_dir = kmotion_dir
        self.thread = thread
        parser = mutex_kmotion_parser_rd(kmotion_dir) 
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.exe_file = os.path.join(self.kmotion_dir, 'event/start.sh')
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', self.thread)
        self.state_file = os.path.join(self.ramdisk_dir, 'states', self.thread)
        
        if len(self.get_prev_instances()) == 0:
            self.start()
        else:
            self.logger.log('%s %s already running' % (os.path.basename(__file__), self.thread), 'CRIT')

    def start(self):
        """
        Creates the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
    
        if os.path.isfile(self.state_file):
            return
    
        if not os.path.isfile(self.event_file):
            self.logger.log('creating: %s' % self.event_file, 'CRIT')
            with open(self.event_file, 'w'):
                pass
    
        if os.path.isfile(self.exe_file):
            self.logger.log('executing: %s' % self.exe_file, 'CRIT')
            subprocess.Popen(['nice', '-n', '20', self.exe_file, self.thread])
        
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^.*%s %s$"' % (os.path.basename(__file__), self.thread), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
    
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    EventStart(kmotion_dir, sys.argv[1])
    
     



