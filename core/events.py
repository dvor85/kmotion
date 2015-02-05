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
import actions.actions as actions

STATE_START = 'start'
STATE_END = 'end'

class Events:
    
    def __init__(self, kmotion_dir, feed, state):        
        self.log = logger.Logger('events', logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
                
        parser = mutex_kmotion_parser_rd(kmotion_dir) 
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', str(self.feed))
        self.state_file = os.path.join(self.ramdisk_dir, 'states', str(self.feed))
        self.state = state
        self.setLastState(self.state)
        
    def setLastState(self, state):
        with open(self.state_file, 'wb') as dump:
            cPickle.dump(state, dump)
            
    def getLastState(self):
        try:
            with open(self.state_file, 'rb') as dump:
                return cPickle.load(dump)
        except:
            return self.state
        
    def main(self):
        if len(self.get_prev_instances()) == 0:
            if self.state == STATE_START:
                self.start()
            elif self.state == STATE_END:
                self.end()  
            else:
                self.log('command "{0}" not recognized'.format(self.state), logger.CRIT)         
        else:
            self.log('{file} {feed} already running'.format(**{'file':os.path.basename(__file__), 'feed':self.feed}), logger.DEBUG)
            
    def start(self):
        """ 
        Creates the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
        self.state = STATE_START
        if not os.path.isfile(self.event_file):
            self.log('start: creating: {0}'.format(self.event_file), logger.DEBUG)
            with open(self.event_file, 'w'):
                pass
        
        actions.Actions(self.kmotion_dir, self.feed).start()
        if self.getLastState() != self.state:
            self.end()
            
            
    def end(self):
        """
        Delete the appropreate file in 'ramdisk_dir/events' and execute the
        appropreate script in 'event' if it exists.
        """
        self.state = STATE_END
        actions.Actions(self.kmotion_dir, self.feed).end()
     
        if os.path.isfile(self.event_file):
            self.log('end: delete {0}'.format(self.event_file), logger.DEBUG)
            os.unlink(self.event_file)
        
        if self.getLastState() != self.state:
            self.start()
            

    
        
    def get_prev_instances(self):
        p_obj = subprocess.Popen('pgrep -f "^python.*%s %i.*"' % (os.path.basename(__file__), self.feed), stdout=subprocess.PIPE, shell=True)
        stdout = p_obj.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
    
    
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    Events(kmotion_dir, sys.argv[1], sys.argv[2]).main()
    
     



