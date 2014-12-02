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
A menu driven daemon diagnostics module
"""

import time, os, sys, ConfigParser
import init_core, init_motion, daemon_whip, mutex

def daemon_diagnostic():
    """
    Generate a primative CLI daemon control menu and act on selections
    
    args    : 
    excepts : 
    return  : none
    """
    
    # set kmotion_dir, remove /core from path
    kmotion_dir = os.getcwd()[:-5]
    # init the ramdisk dir
    init_core.init_ramdisk_dir(kmotion_dir)
    
    print """
kmotion manual daemon control ........"""
    
    while True:
        print """
The Options ....

s: Start Daemons
k: Kill Daemons
r: Reload Daemon configs
q: Quit

ENTER: Refresh"""
        print_status()
        opt = raw_input('Option letter then ENTER to select : ')
        # 's' start daemons - lifted from 'kmotion.py' -------------------------
        if opt == 's':
            if daemon_whip.all_daemons_running():
                print '\nDaemons are already running ...'
                
            else:          
                init_configs(kmotion_dir)
                daemon_whip.start_daemons()
                time.sleep(1)
                if daemon_whip.all_daemons_running():
                    print '\nDaemons have been started ...'
                else:
                    print """
**** W A R N I N G ****
Some daemons refused to start
**** W A R N I N G ****"""
                   
        # 'k' kill daemons -----------------------------------------------------
        elif opt == 'k':
            print '\nDaemons are being killed ... this may take some time ...'
            daemon_whip.kill_daemons()
                
        # 'r' reload daemons ---------------------------------------------------
        elif opt == 'r':
            if daemon_whip.all_daemons_running():
                print '\nDaemons config being reloaded ... this may take some time ...'                
                init_configs(kmotion_dir)
                daemon_whip.reload_all_configs()
            else:
                print """
**** W A R N I N G ****
Some daemons are NOT running so daemon configs have NOT been reloaded
**** W A R N I N G ****"""
        
        # 'q' quit -------------------------------------------------------------
        elif opt =='q':
            print 'Quitting kmotion manual daemon control ...'
            print_status()
            break

        
def print_status():
    """
    Print out the status of the five kmotion daemons, kmotion_hkd1, kmotion_hkd2
    kmotion_fund, kmotion_setd, kmotion_ptzd and motion
    
    args    : 
    excepts : 
    return  : none
    """
            
    status = daemon_whip.daemon_status()
    if status['kmotion_hkd1']:
        text = 'Running'
    else:
        text = 'Not running'
    print '\nkmotion_hkd1.py status : %s' % text
    
    if status['kmotion_hkd2']:
        text = 'Running' 
    else:
        text = 'Not running'
    print 'kmotion_hkd2.py status : %s' % text
    
    if status['kmotion_fund']:
        text = 'Running' 
    else:
        text = 'Not running'
    print 'kmotion_fund.py status : %s' % text
    
    if status['kmotion_setd']:
        text = 'Running' 
    else:
        text = 'Not running'
    print 'kmotion_setd.py status : %s' % text
    
    if status['kmotion_ptzd']:
        text = 'Running' 
    else:
        text = 'Not running'
    print 'kmotion_ptzd.py status : %s' % text
    
    if status['motion']:
        text = 'Running' 
    else:
        text = 'Not running'
    print 'motion status          : %s\n' % text

        
def init_configs(kmotion_dir):
    """
    Init kmotion configs ready for deamon reloading.
    
    args    : 
    excepts : 
    return  : none
    """

    try:
        mutex.acquire(kmotion_dir, 'kmotion_rc')   
        parser = ConfigParser.SafeConfigParser()
        parser.read('../kmotion_rc') 
    finally:
        mutex.release(kmotion_dir, 'kmotion_rc')
        
    ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
    
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.update_rcs(kmotion_dir, ramdisk_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        print '\ncorrupt \'kmotion_rc\' : %s\n' % sys.exc_info()[1]
        sys.exit()
            
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.gen_vhost(kmotion_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        print '\ncorrupt \'kmotion_rc\' : %s\n' % sys.exc_info()[1]
        sys.exit()
    
    # init the ramdisk dir
    init_core.init_ramdisk_dir(kmotion_dir)
    # init motion_conf directory with motion.conf, thread1.conf ...
    init_motion.gen_motion_configs(kmotion_dir)
    
    
    
daemon_diagnostic()



