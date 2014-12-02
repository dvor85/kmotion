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
The core installer
"""

import os, stat, sys, ConfigParser, shutil
from subprocess import * # breaking habit of a lifetime !
import core.init_core as init_core

class exit_(Exception): pass


INSTALL_TEXT = """
****************************************************************************

Welcome to the kmotion v2 install core. If this code fails 
please file a bug at http://code.google.com/p/kmotion-v2-code/issues/list  
with full details so kmotion can be improved.

****************************************************************************

This installer will configure the kmotion core. This is used as part of a 
manual install and is not a full install.

Type \'install core\' to start install :"""

LINE_TEXT = """
****************************************************************************
"""


def install():  
    """
    The core install script for manual install

    args    :   
    excepts : 
    return  : none
    """
        
    # ##########################################################################
    
    print INSTALL_TEXT,
    if raw_input() != 'install core':
        raise exit_('Install aborted')
    print LINE_TEXT


    # ##########################################################################
    
    # check we are not running as root
    checking('Checking install is not running as root')
    uid = os.getuid()
    if uid == 0:
        fail()
        raise exit_('The installer needs to be run as a normal user')
    ok()
    
    # ##########################################################################
    
    # check we can read ./core/kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking installer is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion root directory before running the installer')
    ok()

    # if we are in the root dir set kmotion_dir
    kmotion_dir = os.getcwd()
    
    kmotion_uid = os.stat('%s/install_core.py' % kmotion_dir)[stat.ST_UID]
    kmotion_gid = os.stat('%s/install_core.py' % kmotion_dir)[stat.ST_GID]
    
    parser = ConfigParser.SafeConfigParser()
    parser.read('%s/kmotion_rc' % kmotion_dir)
    ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
    
    # check for existing motion instances
    checking('Checking for existing \'motion\' daemon instances')
    check_motion(kmotion_dir)
    ok()
      
    # ##########################################################################
    
    # initialise resource configurations
    checking('Initialise resource configurations')
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.init_rcs(kmotion_dir, ramdisk_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        fail()
        raise exit_('Corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
    ok()
    
    # ##########################################################################
    
    # setup FIFO's
    checking('Generating FIFO\'s')
    # use BASH rather than os.mkfifo(), FIFO bug workaround :)
    fifo_func = '%s/www/fifo_func' % kmotion_dir
    if not os.path.exists(fifo_func):
        # os.mkfifo(fifo_func)
        call(['mkfifo', fifo_func])
    
    fifo_settings = '%s/www/fifo_settings_wr' % kmotion_dir
    if not os.path.exists(fifo_settings):
        # os.mkfifo(fifo_settings)
        call(['mkfifo', fifo_settings])
    
    fifo_ptz = '%s/www/fifo_ptz' % kmotion_dir
    if not os.path.exists(fifo_ptz):
        #os.mkfifo(fifo_ptz)
        call(['mkfifo', fifo_ptz])

    fifo_ptz_preset = '%s/www/fifo_ptz_preset' % kmotion_dir
    if not os.path.exists(fifo_ptz_preset):
        #os.mkfifo(fifo_ptz_preset)
        call(['mkfifo', fifo_ptz_preset])
    ok()
    
    # ##########################################################################
    
    # generate kmotion vhost
    checking('Generating kmotion vhost')
    try: # wrapping in a try - except because parsing data from kmotion_rc
        init_core.gen_vhost(kmotion_dir)
    except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
        fail()
        raise exit_('Corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
    
    # chown is needed so kmotion vhost is not locked to root allowing non root
    # kmotion to regenerate the vhost
    os.chown('%s/www/vhosts/kmotion' % kmotion_dir, kmotion_uid, kmotion_gid) 
    ok()
    
    # ##########################################################################
    
    checking('Generating \'kmotion\' executable')
    init_core.gen_kmotion(kmotion_dir, kmotion_uid, kmotion_gid)
    ok()

    # ##########################################################################
    
    checking('Generating \'kmotion_ptz\' executable')
    init_core.gen_kmotion_ptz(kmotion_dir, kmotion_uid, kmotion_gid)
    ok()
    
    print LINE_TEXT


def check_motion(kmotion_dir):
    """
    Check for any invalid motion processes
    
    args    :   
    excepts : exit_ ... if motion daemon already running
    return  : none
    """
    
    p_objs = Popen('ps ax | grep -e [[:space:]/]motion[[:space:]/] | grep -v \'\-c %s/core/motion_conf/motion.conf\'' % kmotion_dir, shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
    line = p_objs.stdout.readline()   
    
    if line != '':
        raise exit_("""\nAn instance of the motion daemon has been detected which is not under control 
of kmotion. Please kill this instance and ensure that motion is not started
automatically on system bootup. This a known problem with Ubuntu 8.04 
Reference Bug #235599.""")

    
def list_format(list_):
    """
    Changes a list of strings into a comma seperated string containing all the
    list items with an 'or' instead of the last comma

    args    : list_ ...  a list of strings
    excepts : 
    return  : string ... a single formatted string
    """
    
    tmp = '\'%s\'' % list_[0]  # for correct ',' logic    
    for i in list_[1:-1]: tmp += ', \'%s\'' % i
    return '%s or \'%s\'' % (tmp, list_[-1])


def checking(text_):
    """
    Print the text and calculate the number of '.'s

    args    : text ... the string to print
    excepts : 
    return  : none
    """
    
    print text_, '.' *  (68 - len(text_)) ,


def ok():
    """
    print [ OK ]

    args    : 
    excepts : 
    return  : none
    """
    
    print '[ OK ]'


def fail():
    """
    print [FAIL]

    args    : 
    excepts : 
    return  : none
    """
    
    print '[FAIL]'


try:
    install()
except exit_, text:
    print '\n%s\n' % text
