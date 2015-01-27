#!/usr/bin/env python

# Copyright 2008 David Selby dave6502googlemail.com

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
Upgrade kmotion to the latest version
"""

import os, sys, time, urllib, shutil, ConfigParser, stat
from subprocess import * # breaking habit of a lifetime !

import core.mutex       as mutex
import core.daemon_whip as daemon_whip
import core.init_core   as init_core

class exit_(Exception): pass

RESET_TEXT = """
****************************************************************************

Welcome to the kmotion v2 automatic upgrader. If this upgrader fails 
please file a bug at http://code.google.com/p/kmotion-v2-code/issues/list 
with full details so kmotion can be improved.

****************************************************************************

This script will upgrade your system to the latest version

Type \'upgrade\' to upgrade :"""

LINE_TEXT = """
****************************************************************************
"""

APACHE_UPGRADED_TEXT = """
****************************************************************************

UPGRADING HAS FINISHED, REBOOT THE SYSTEM TO TEST THE AUTO START SCRIPT OR 
MANUALLY RESTART APACHE2 THEN EXECUTE 'kmotion start'.

POINT YOUR BROWSER (HOPEFULLY FIREFOX) TO 'http://localhost:8085' OR 
'http://xx.xx.xx.xx:8085' THE DEFAULT USERNAME IS 'kmotion', THE DEFAULT 
PASSWORD IS 'kmotion'. 

FOR CONFIGURATION DETAILS PLEASE REFER TO THE VIDEOS AT :
'http://kmotion.eu/mediawiki/index.php/Videos_v2'
"""

UPGRADED_TEXT = """
****************************************************************************

UPGRADING HAS FINISHED, REBOOT THE SYSTEM TO TEST THE AUTO START SCRIPT OR 
EXECUTE 'kmotion start'.

POINT YOUR BROWSER (HOPEFULLY FIREFOX) TO 'http://localhost:8085' OR 
'http://xx.xx.xx.xx:8085' THE DEFAULT USERNAME IS 'kmotion', THE DEFAULT 
PASSWORD IS 'kmotion'. 

FOR CONFIGURATION DETAILS PLEASE REFER TO THE VIDEOS AT :
'http://kmotion.eu/mediawiki/index.php/Videos_v2'
"""

NOT_UPGRADED_TEXT = """
****************************************************************************

KMOTION IS ALREADY AT THE LATEST VERSION."""


def upgrade():  
    """
    Upgrades kmotion to the latest version
    
    args    :   
    excepts : 
    return  : none
    """
    

    print RESET_TEXT,
    raw_ip = raw_input()
    if raw_ip != 'upgrade':
        raise exit_('Upgrade aborted')
    
    print LINE_TEXT
         
    # ##########################################################################
    
    # check we are running as root
    checking('Checking upgrade is running as root')
    uid = os.getuid()
    if uid != 0:
        fail()
        raise exit_('The upgrade must be run root')
    ok()
    
    # ##########################################################################
    
    # check we can read ./kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking upgrade is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion directory before running the upgrade')
    ok()

    # if we are in the root dir set kmotion_dir
    kmotion_dir = os.getcwd()
    
    # ##########################################################################
    
    checking('Checking that kmotion is currently installed')
    if not os.path.isfile('%s/www/vhosts/kmotion' % kmotion_dir):
        fail()
        raise exit_('Please install kmotion first before attempting to upgrade')
    ok()
    
    # ##########################################################################
    
    checking('Cleaning upgrade directory')
    wipe_upgrade_dir()
    ok()
    
    # ##########################################################################
    
    checking('Checking current version')
    parser = mutex_kmotion_parser_rd(kmotion_dir)
    current_version = parser.get('version', 'string')
    ok()
    
    latest_version = get_latest_version(current_version)
    checking('Checking latest version')
    ok()
    
    # ##########################################################################
    
    if latest_version == 'SVN':
        raise exit_('Can\'t upgrade SVN version, \'svn update\' for the latest build')
    
    if latest_version != current_version:
        
        # download the latest version
        checking('Downloading version %s' % latest_version)
        ok()
        download_version(latest_version)
    
        # ######################################################################
        
        checking('Saving \'ramdisk_dir\' location')
        ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
        ok()
    
        # ######################################################################
        
        # chdir to kmotion/core/upgrade for gunzip and tar
        os.chdir('/tmp/kmotion_upgrade')
        
        checking('Un-zipping')
        Popen('gunzip upgrade.tar.gz', shell=True)
        time.sleep(2) # else tar cannot always find file
        ok()
        
        checking('Un-taring')
        Popen('tar xf upgrade.tar', shell=True)
        ok()
        
        # and back to kmotion/core
        os.chdir('%s/core' % kmotion_dir)
        
        # ######################################################################
        
        checking('Killing kmotion daemons')
        daemon_whip.end()
        ok()
        
        # ######################################################################
        
        # walk through updateing files
        checking('Updateing files')
        ok()
        update_all(kmotion_dir)
        
        # ######################################################################
        
        # set 'ramdisk_dir' in kmotion_rc
        checking('Restoreing \'ramdisk_dir\' location')
        parser = mutex_kmotion_parser_rd(kmotion_dir)
        parser.set('dirs', 'ramdisk_dir', ramdisk_dir)
        mutex_kmotion_parser_wr(kmotion_dir, parser)
        ok()
        
        # initialise resource configurations
        checking('Initialise resource configurations')
        try: # wrapping in a try - except because parsing data from kmotion_rc
            init_core.update_rcs(kmotion_dir, ramdisk_dir)
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            fail()
            raise exit_('Corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
        ok()
    
        # ######################################################################
        
        # cleaning up
        checking('Cleaning upgrade directory')
        wipe_upgrade_dir()
        ok()
        
        # ######################################################################
        
        checking('Restarting apache2')
        ok()
        if not restart_apache2():
            checking('Restarted apache2')
            fail()
            print APACHE_UPGRADED_TEXT

        else:
            checking('Restarted apache2')
            ok()
            print UPGRADED_TEXT
            
        print LINE_TEXT

    else:
        
        print NOT_UPGRADED_TEXT
        print LINE_TEXT



def get_latest_version(current_ver):
    """        
    Returns the latest kmotion software version by parsing the webpage
    'http://code.google.com/p/kmotion-v2-code/downloads/list'. If 'current_ver' 
    not found on webpage, must be an 'unautherised' version so return 'SVN'
    
    args    : current_ver     ... the current version string
    excepts : 
    return  : str         ... the latest version string or 'SVN'
    """
    
    url = 'http://code.google.com/p/kmotion-v2-code/downloads/list'
        
    opener = urllib.FancyURLopener()
    try: # read the webpage
        f_obj = opener.open(url)
        html = f_obj.read()
        f_obj.close()
    except IOError:
        raise exit_('Can\'t parse latest version from  \'%s\' IOError' % url)
        
    # parse the webpage for the current version, if not there must be an 
    # 'unauthorised' version ie SVN
    start = html.find('http://kmotion-v2-code.googlecode.com/files/kmotion_' + current_ver.replace(' ', '_') + '.tar.gz')
    if start != -1:
        
        # parse the webpage for the latest version
        start = html.find('http://kmotion-v2-code.googlecode.com/files/kmotion_') + 52
        end = html.find('.tar.gz', start)
        
        if start == 44: # cant find = -1, plus 45 = 44
            raise exit_('Can\'t parse latest version from  \'%s\' can\'t find string' % url)
        
        return html[start:end].replace('_', ' ')
    
    else:
        
        return 'SVN'
    

def download_version(version):
    """      
    Downloads and saves the kmotion version 'version' saving it in 
    '/tmp/kmotion_update/upgrade.tar.gz'
    
    args    : version         ... the version string
    excepts : 
    return  : 
    """
    
    # download version
    url = 'http://kmotion-v2-code.googlecode.com/files/kmotion_' + version.replace(' ', '_') + '.tar.gz'
        
    opener = urllib.FancyURLopener()
    try: 
        f_obj = opener.open(url)
        gzip_file = f_obj.read()
        f_obj.close()
    except IOError:
        raise exit_('Can\'t download latest version from  \'%s\' IOError' % url)
    
    # and save it
    checking('Saving version %s' % version)
    ok()
    try: 
        os.mkdir('/tmp/kmotion_upgrade')
        f_obj = open('/tmp/kmotion_upgrade/upgrade.tar.gz', 'w')
        f_obj.write(gzip_file)
        f_obj.close()
    except IOError:
        raise exit_('Can\'t save latest version as /tmp/kmotion_upgrade/upgrade.tar.gz')

    
def update_all(kmotion_dir):
    """      
    Walk through '/tmp/kmotion_update/kmotion' updateing existing directories
    and files as appropreate.
    
    args    : kmotion_dir ... the current kmotion dir
    excepts : 
    return  : 
    """

    EXCLUDE_DIRS  = ['event', 'func', 'images_dbase', 'virtual_motion_conf', 'mutex', 'logs', 'www_rc']
    EXCLUDE_FILES = ['kmotion_rc', 'www_rc', 'logs', 'motion_out', 'servo_state', 'motion.conf', 'thread01.conf',
                     'thread02.conf', 'thread03.conf', 'thread04.conf', 'thread05.conf', 'thread06.conf', 
                     'thread07.conf', 'thread08.conf', 'thread09.conf', 'thread10.conf', 'thread11.conf', 
                     'thread12.conf', 'thread13.conf', 'thread14.conf', 'thread15.conf', 'thread16.conf',
                     'users_digest']
    
    stat_obj = os.stat('%s/upgrade.py' % kmotion_dir)
    uid, gid = stat_obj[stat.ST_UID], stat_obj[stat.ST_GID]
    
    for root, dirs, files in os.walk('/tmp/kmotion_upgrade/kmotion'):
        
        for dir_ in [i for i in dirs if i not in EXCLUDE_DIRS]:
            
            copy_from = os.path.join(root, dir_)
            stat_obj = os.stat(copy_from)
            mode = stat_obj[stat.ST_MODE]

            to_root = root.split('/kmotion_upgrade/kmotion')[1]
            copy_to = os.path.normpath('%s/%s/%s' % (kmotion_dir, to_root, dir_))
            
            if not os.path.isdir(copy_to):
                os.mkdir(copy_to)
                
            os.chmod(copy_to, mode)
            os.chown(copy_to, uid, gid)
            
        for file_ in [i for i in files if i not in EXCLUDE_FILES]:
            
            copy_from = os.path.join(root, file_)

            to_root = root.split('/kmotion_upgrade/kmotion')[1]
            copy_to = os.path.normpath('%s/%s/%s' % (kmotion_dir, to_root, file_))
            
            shutil.copy2(copy_from, copy_to)
            os.chown(copy_to, uid, gid)

    
def wipe_upgrade_dir():
    """   
    Removes all files and directories in the upgrade directory
    
    args    : kmotion_dir ... the current kmotion dir
    excepts : 
    return  :
    """
    
    if os.path.isfile('/tmp/kmotion_upgrade/upgrade.tar.gz'):
        os.remove('/tmp/kmotion_upgrade/upgrade.tar.gz')
        
    if os.path.isfile('/tmp/kmotion_upgrade/upgrade.tar'):
        os.remove('/tmp/kmotion_upgrade/upgrade.tar')
        
    shutil.rmtree('/tmp/kmotion_upgrade', True)
    
    
def restart_apache2():
    """
    Restart the apache2 server

    args    : 
    excepts : 
    return  : bool ... success
    """
    
    p_objs = Popen('which apache2ctl', shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE, close_fds=True)
    if p_objs.stdout.readline() != '': 
        return (call(['apache2ctl', 'restart']) == 0)
        
    else:
        return (call(['apachectl', 'restart']) == 0)
        
    #apache2s = ['/etc/init.d/apache2', '/etc/init.d/httpd']
    #for apache2 in apache2s:  
        #if os.path.isfile(apache2):
            #print
            #os.system('%s restart' % apache2) # os.system used deliberately as 
                                              ## it dumps output to term real time
            #return True

    #return False
    
                                             
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


def mutex_kmotion_parser_wr(kmotion_dir, parser):
    """
    Safely write a parser instance to 'kmotion_rc' under mutex control.
    
    args    : kmotion_dir ... the 'root' directory of kmotion
              parser      ... the parser instance 
    excepts : 
    return  : 
    """

    try:
        mutex.acquire(kmotion_dir, 'kmotion_rc')
        f_obj = open('%s/kmotion_rc' % kmotion_dir, 'w')
        parser.write(f_obj)
        f_obj.close()
    finally:
        mutex.release(kmotion_dir, 'kmotion_rc')

        
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
    upgrade()
except exit_, text:
    print '\n%s\n' % text
    
    