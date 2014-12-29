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

from subprocess import *  # breaking habit of a lifetime !
import ConfigParser
import time
import os, sys

from core.init_core import InitCore
from core.init_motion import InitMotion
import core.logger as logger
from core.daemon_control import DaemonControl
from core.kmotion_hkd1 import Kmotion_Hkd1


log_level = 'WARNING' 
logger = logger.Logger('kmotion', log_level)

class exit_(Exception): pass


def main(settings):
    """
    Re-initialises the kmotion core and reload the kmotion daemon configs
       
    args    : start|stop|reload on command line
    excepts : 
    return  : none
    """
    
    # set kmotion_dir, remove /core from path    
        
    daemonControl = DaemonControl(settings)
    
    option = sys.argv[1]
    
    # if 'stop' shutdown and exit here
    if option == 'stop':
        logger.log('stopping kmotion ...', 'CRIT')
        daemonControl.kill_daemons()
        return
    
    elif option == 'start':
        logger.log('starting kmotion ...', 'CRIT')
    elif option == 'restart':
        logger.log('restarting kmotion ...', 'CRIT')
    elif option == 'status':
        print daemonControl.daemon_status()
        return
    
    if daemonControl.is_motion_running():
        logger.log('** CRITICAL ERROR ** kmotion failed to start ...', 'CRIT')
        logger.log('** CRITICAL ERROR ** Another instance of motion daemon has been detected', 'CRIT')
        raise exit_("""An instance of the motion daemon has been detected which is not under control 
                        of kmotion. Please kill this instance and ensure that motion is not started
                        automatically on system bootup. This a known problem with Ubuntu 8.04 
                        Reference Bug #235599.""")

    initCore = InitCore(settings)
    initMotion = InitMotion(settings)
    # init the ramdisk dir
    initCore.init_ramdisk_dir()
    
    try:  # wrapping in a try - except because parsing data from kmotion_rc
        initCore.update_rcs()
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        raise exit_('corrupt \'settings.cfg\' : %s' % (sys.exc_info()[1]))
    
    try:  # wrapping in a try - except because parsing data from kmotion_rc
        initCore.gen_vhost()
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        raise exit_('corrupt \'settings.cfg\' : %s' % (sys.exc_info()[1]))

    # init motion_conf directory with motion.conf, thread1.conf ...
    initMotion.gen_motion_configs()
    
    # speed kmotion startup
    if not daemonControl.is_daemons_running():
        daemonControl.start_daemons()
    else:
        daemonControl.reload_all_configs()
          
    time.sleep(1)  # purge all fifo buffers, FIFO bug workaround :)
    purge_str = '#' * 1000 + '99999999'
    
    for fifo in ['fifo_func', 'fifo_ptz', 'fifo_ptz_preset', 'fifo_settings_wr']:        
        with os.open('%s/www/%s' % (kmotion_dir, fifo), os.O_WRONLY) as pipeout:
            os.write(pipeout, purge_str)

if __name__ == '__main__':
    kmotion_dir = os.path.dirname(__file__)    
    settings = ConfigParser.SafeConfigParser()
    settings.read(os.path.join(kmotion_dir,'settings.cfg'))
    settings.set('DEFAULT', 'kmotion_dir', kmotion_dir)
    Kmotion_Hkd1(settings).start() 
    print 'started'
    #main(settings)


