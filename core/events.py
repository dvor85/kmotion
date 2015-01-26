#!/usr/bin/env python
from sys import stderr

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

import os, sys, subprocess, time, datetime
import logger, ConfigParser
from mutex_parsers import *
from StringIO import StringIO
import shlex



class Events:
    log_level = 'WARNING'
    
    def __init__(self, kmotion_dir, action, feed):        
        self.logger = logger.Logger('event_start', Events.log_level)
        self.kmotion_dir = kmotion_dir
        self.feed = feed
        self.action = action
        parser = mutex_kmotion_parser_rd(kmotion_dir) 
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
    
        self.event_file = os.path.join(self.ramdisk_dir, 'events', self.feed)
        self.state_file = os.path.join(self.ramdisk_dir, 'states', self.feed)
        
        try:
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.feed_rtsp_url = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_rtsp_url')
            self.feed_reboot_url = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_reboot_url') 
            self.feed_sound = www_parser.getboolean('motion_feed%02i' % int(self.feed), 'feed_sound')
            self.feed_format = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_format')
            self.feed_kbs = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_kbs')
            self.feed_recode = www_parser.getboolean('motion_feed%02i' % int(self.feed), 'feed_recode')
            self.username = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_lgn_name')
            self.password = www_parser.get('motion_feed%02i' % int(self.feed), 'feed_lgn_pw')
        except:
            pass
        
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
            
    def get_parser_event_file(self):
        with open(self.event_file, 'r') as f_obj:
            parser = ConfigParser.SafeConfigParser()
            parser.readfp(StringIO('[root]\n' + f_obj.read()))
        return parser
            
            
    def is_grab_started(self):
        try:
            parser = self.get_parser_event_file()
            pid = parser.get('root', 'pid')
            trys = 2
            while trys > 0:
                if not os.path.isfile(os.path.join('/proc', pid)):
                    return False
                trys -= 1
                time.sleep(0.5)
        except:
            return False
        return True
        
            
    def start_event(self):

        dt = datetime.datetime.fromtimestamp(time.time())
        event_date = dt.strftime("%Y%m%d")
        movie_file = dt.strftime("%H%M%S")
        snap_file = "%s/%s/%s%s.jpg" % (self.ramdisk_dir, self.feed, event_date, movie_file)
        dbase_dir = os.path.join(self.images_dbase_dir, event_date, self.feed)
        movie_dir = os.path.join(dbase_dir, 'movie')
        snap_dir = os.path.join(dbase_dir, 'snap')
        
        
        if not self.is_grab_started():
        
            if not os.path.isdir(movie_dir):
                os.makedirs(movie_dir)   
                
            dst = os.path.join(movie_dir, '%s.%s' % (movie_file, self.feed_format))        
    
            pid = self.start_grab(self.feed_rtsp_url, dst) 
            
            if not pid == '' and os.path.isdir(os.path.join('/proc', str(pid))):
                with open(self.event_file, 'w') as f_obj:
                    f_obj.write('pid=%s\n' % str(pid))
                    f_obj.write('movie=%s\n' % movie_file)
                    f_obj.write('date=%s\n' % event_date)
            else:
                os.unlink(dst)


    def start_grab(self, src, dst):
        if self.feed_sound:
            audio = "-c:a libfaac -ac 1 -ar 22050 -b:a 64k" 
        else:
            audio = "-an";
        
        if self.feed_recode:
            vcodec = "-c:v libx264 -preset ultrafast -profile:v baseline -b:v %sk -qp 30" % self.feed_kbs
        else:
            vcodec = '-c:v copy'
            
        grab = 'avconv -rtsp_transport tcp -n -i {src} {vcodec} {audio} {dst}'.format(**{'src':src, 'dst':dst, 'vcodec':vcodec, 'audio':audio})
        
        try:
            from subprocess import DEVNULL # py3k
        except ImportError:
            DEVNULL = open(os.devnull, 'wb')
            
        ps = subprocess.Popen(shlex.split(grab), stderr=DEVNULL, stdout=DEVNULL, close_fds=True)
        return ps.pid

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
    
     



