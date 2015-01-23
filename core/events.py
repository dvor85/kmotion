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
Creates the appropreate file in 'ramdisk_dir/events' and execute the
appropreate script in 'event' if it exists.
"""

import os, sys, subprocess, time
import logger
from mutex_parsers import *



class Events:
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir, action, feed):        
        self.logger = logger.Logger('event_start', Events.log_level)
        self.kmotion_dir = kmotion_dir
        self.feed = feed
        self.action = action
        parser = mutex_kmotion_parser_rd(kmotion_dir) 
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', self.feed)
        self.state_file = os.path.join(self.ramdisk_dir, 'states', self.feed)
        
    def main(self):
        if len(self.get_prev_instances()) == 0:
            if self.action == 'start':
                self.start(os.path.join(self.kmotion_dir, 'event/start.sh'))
            elif self.action == 'stop':
                self.stop(os.path.join(self.kmotion_dir, 'event/stop.sh'))
            elif self.action == 'lost':
                self.lost(os.path.join(self.kmotion_dir, 'event/lost.sh'))
        else:
            self.logger.log('%s %s already running' % (os.path.basename(__file__), self.feed), 'CRIT')

    def start(self, exe_file):
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
    
        if os.path.isfile(exe_file):
            self.logger.log('executing: %s' % exe_file, 'CRIT')
            subprocess.Popen(['nice', '-n', '20', exe_file, self.feed])
            
    def stop(self, exe_file):
        """
        Delete the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
        
        if os.path.isfile(self.state_file):
            os.unlink(self.state_file)
            return
            
        if os.path.isfile(exe_file):
            self.logger.log('executing: %s' % exe_file, 'CRIT')
            subprocess.Popen(['nice', '-n', '20', exe_file, self.feed])
     
        if os.path.isfile(self.event_file) and os.path.getsize(self.event_file) == 0:
            self.logger.log('deleting: %s' % self.event_file, 'CRIT')
            os.unlink(self.event_file)
            
    def lost(self, exe_file):      
        if os.path.isfile(exe_file):
            self.logger.log('executing: %s' % exe_file, 'CRIT')
            subprocess.Popen(['nice', '-n', '20', exe_file, self.feed])
    
        
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f ".*%s %s %s$"' % (os.path.basename(__file__), self.action, self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
    
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
    
     



