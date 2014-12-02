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
Waits on the 'fifo_func' fifo until data received then check the
appropriate script exists and execute it
"""

import sys, os.path, subprocess, time, traceback
import logger
 
log_level = 'WARNING'
logger = logger.Logger('kmotion_fund', log_level)


def main():  
    """
    Waits on the 'fifo_func' fifo until data received then check the
    appropriate script exists and execute it
    
    args    : 
    excepts : 
    return  : none
    """

    logger.log('starting daemon ...', 'CRIT')
    kmotion_dir = os.getcwd()[:-5]
    
    while True:
        
        logger.log('waiting on FIFO pipe data', 'DEBUG')
        data = subprocess.Popen(['cat', '%s/www/fifo_func' % kmotion_dir], stdout=subprocess.PIPE).communicate()[0]
        data = data.rstrip()
        logger.log('FIFO pipe data: %s' % data, 'DEBUG')
        
        if len(data) > 2 and data[-3:] == '999': # FIFO purge
            logger.log('FIFO purge', 'DEBUG')
            continue
        
        shell = '%s/func/func%02i.sh' % (kmotion_dir, int(data))
        if os.path.isfile(shell):
            logger.log('executing: %s' % shell, 'CRIT')
            os.popen3('nohup %s &' % shell)
        else:
            logger.log('can\'t find: %s' % shell, 'CRIT')
            
            
# it is CRUCIAL that this code is bombproof

while True:
    try:    
        main()
    except: # global exception catch
        exc_type, exc_value, exc_traceback = sys.exc_info()
        exc_trace = traceback.extract_tb(exc_traceback)[-1]
        exc_loc1 = '%s' % exc_trace[0]
        exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
        
        logger.log('** CRITICAL ERROR ** kmotion_fund crash - type: %s' 
                   % exc_type, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_fund crash - value: %s' 
                   % exc_value, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_fund crash - traceback: %s' 
                   %exc_loc1, 'CRIT')
        logger.log('** CRITICAL ERROR ** kmotion_fund crash - traceback: %s' 
                   %exc_loc2, 'CRIT')
        time.sleep(60)
           
    

