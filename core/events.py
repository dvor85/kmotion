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

import os, sys, subprocess, time, datetime, logger, cPickle
from mutex_parsers import *
from grabbers.grabber import Grabber

class Events:
    log_level = logger.WARNING
    
    def __init__(self, kmotion_dir, feed, state):        
        self.logger = logger.Logger('event_start', Events.log_level)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
                
        parser = mutex_kmotion_parser_rd(kmotion_dir) 
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        self.state_file = os.path.join(self.ramdisk_dir, 'states', str(self.feed))
        self.setLastState(self.state)
        
    def setLastState(self, state):
        self.state = state
        with open(self.state_file, 'wb') as dump:
            cPickle.dump(self.state, dump)
            
    def getLastState(self):
        try:
            with open(self.state_file, 'rb') as dump:
                return cPickle.load(dump)
        except:
            return self.state
        
    def main(self):
        if len(self.get_prev_instances()) == 0:
            if self.state == 'start':
                self.start()
            elif self.state == 'end':
                self.end()
            elif self.state == 'lost':
                self.lost(os.path.join(self.kmotion_dir, 'event/lost.sh'))
        else:
            self.logger.log('%s %i already running' % (os.path.basename(__file__), self.feed), logger.CRIT)
            
    def start(self):
        """ 
        Creates the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
    
        if not os.path.isfile(self.event_file):
            self.logger.log('creating: %s' % self.event_file, logger.CRIT)
            with open(self.event_file, 'w'):
                pass
        
        Grabber(self.kmotion_dir, self.feed).start()
        time.sleep(10)
        if self.getLastState() != self.state:
            self.state = self.getLastState()
            self.end()
            
            
    def end(self):
        """
        Delete the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
        
        Grabber(self.kmotion_dir, self.feed).end()
     
        if os.path.isfile(self.event_file) and os.path.getsize(self.event_file) == 0:
            self.logger.log('deleting: %s' % self.event_file, logger.CRIT)
            os.unlink(self.event_file)
        
        if self.getLastState() != self.state:
            self.state = self.getLastState()
            self.start()
            
    def lost(self, exe_file):      
        if os.path.isfile(exe_file):
            self.logger.log('executing: %s' % exe_file, logger.CRIT)
            subprocess.Popen(['nice', '-n', '20', exe_file, str(self.feed)])
    
        
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f ".*%s %i.*$"' % (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
    
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
    
     



