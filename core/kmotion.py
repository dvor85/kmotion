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

import os, sys, time, ConfigParser
from subprocess import * # breaking habit of a lifetime !
import init_core, init_motion, daemon_whip, logger
import mutex

log_level = 'WARNING' 
logger = logger.Logger('kmotion', log_level)

class exit_(Exception): pass


def main():
    """
    Re-initialises the kmotion core and reload the kmotion daemon configs
       
    args    : start|stop|reload on command line
    excepts : 
    return  : none
    """
    
    # set kmotion_dir, remove /core from path
    kmotion_dir = os.getcwd()[:-5]
    
    option = sys.argv[1]
    # if 'stop' shutdown and exit here
    if option == 'stop':
        logger.log('stopping kmotion ...', 'CRIT')
        daemon_whip.kill_daemons()
        return
    
    elif option == 'start':
        logger.log('starting kmotion ...', 'CRIT')
    elif option == 'restart':
        logger.log('restarting kmotion ...', 'CRIT')
    elif option == 'status':
	print daemon_whip.daemon_status()
	return
    # check for any invalid motion processes
    p_objs = Popen('ps ax | grep -e [[:space:]]motion | grep -v \'\-c %s/core/motion_conf/motion.conf\'' % kmotion_dir, shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
    line = p_objs.stdout.readline()
    
    if line != '':
        logger.log('** CRITICAL ERROR ** kmotion failed to start ...', 'CRIT')
        logger.log('** CRITICAL ERROR ** Another instance of motion daemon has been detected', 'CRIT')
        raise exit_("""An instance of the motion daemon has been detected which is not under control 
of kmotion. Please kill this instance and ensure that motion is not started
automatically on system bootup. This a known problem with Ubuntu 8.04 
Reference Bug #235599.""")

    # init the ramdisk dir
    init_core.init_ramdisk_dir(kmotion_dir)
    
    # init the mutex's
    mutex.init_mutex(kmotion_dir, 'www_rc')
    mutex.init_mutex(kmotion_dir, 'kmotion_rc')
    mutex.init_mutex(kmotion_dir, 'logs')
    
    parser = mutex_kmotion_parser_rd(kmotion_dir)
    ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
    max_feed = parser.getint('misc', 'max_feed')
    
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.update_rcs(kmotion_dir, ramdisk_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
    
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.gen_vhost(kmotion_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])

    # init motion_conf directory with motion.conf, thread1.conf ...
    init_motion.gen_motion_configs(kmotion_dir)
    
    # speed kmotion startup
    if daemon_whip.no_daemons_running():
        daemon_whip.start_daemons()
    elif daemon_whip.all_daemons_running():
        daemon_whip.reload_all_configs()
    else:
        daemon_whip.start_daemons()
        daemon_whip.reload_all_configs()
          
    time.sleep(1) # purge all fifo buffers, FIFO bug workaround :)
    purge_str = '#' * 1000 + '99999999'
    for fifo in ['fifo_func', 'fifo_ptz', 'fifo_ptz_preset', 'fifo_settings_wr']:
        
        pipeout = os.open('%s/www/%s' % (kmotion_dir, fifo), os.O_WRONLY)
        os.write(pipeout, purge_str)
        os.close(pipeout)
            
            
def mutex_kmotion_parser_rd(kmotion_dir):
    """
    Safely generate a parser instance and under mutex control read 'kmotion_rc'
    returning the parser instance.
    
    args    : kmotion_dir ... the 'root' directory of kmotion   
    excepts : 
    return  : parser ... a parser instance
    """
    
    parser = ConfigParser.SafeConfigParser()
    try:
        mutex.acquire(kmotion_dir, 'kmotion_rc')
        parser.read('%s/kmotion_rc' % kmotion_dir)
    finally:
        mutex.release(kmotion_dir, 'kmotion_rc')
    return parser


if __name__ == '__main__':
    main()


