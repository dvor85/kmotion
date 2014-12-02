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
Called by the kmotion_ptz exe file this module passes the feed and preset 
parameters into the 'fifo_ptz_preset' fifo

The kmotion_ptz exe file cannot call this code directly because it may be in a 
different working directory
"""

import os, sys, os.path, logger

log_level = 'WARNING'
logger = logger.Logger('kmotion_ptz', log_level)

def main():
    """
    Feed the two command line parameters to 'fifo_ptz_preset'
    
    args    :
    excepts : 
    return  : none 
    """

    try:
        feed =   int(sys.argv[1])
        preset = int(sys.argv[2])
    except (IndexError, ValueError): 
        logger.log('invalid parameter - crash value: %s' 
                   % sys.exc_info()[1], 'CRIT')
        return
    
    if 0 < feed < 17 and 0 < preset < 5:
        logger.log('main() - activating preset feed: %s preset: %s' % (feed, preset), 'DEBUG')
        www_dir = os.path.abspath('../www')
        pipeout = os.open('%s/fifo_ptz_preset' % www_dir, os.O_WRONLY)
        os.write(pipeout, 'f%02ip%i#' % (feed, preset))
        os.close(pipeout)
    else:
        logger.log('invalid parameter - feed <1-16>: %s preset <1-4>: %s' 
                   % (feed, preset), 'CRIT')

    
if __name__ == '__main__':
    main()

















