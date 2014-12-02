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
Changes the login user name and password
"""

import os, time
from subprocess import * # breaking habit of a lifetime !

class exit_(Exception): pass

CHANGE_TEXT = """
****************************************************************************

Welcome to the kmotion v2 login setup. If this code fails please file a bug 
at http://code.google.com/p/kmotion-v2-code/issues/list with full details so 
kmotion can be improved.

****************************************************************************
This script will delete any old login user names and passwords and setup a 
single new pair. If you require multiple logins and passwords exit here and 
use 'htpasswd' saving your digests in 'kmotion/www/passwords/users_digest'.

Type \'change\' to change :"""

UNAME_TEXT = """
****************************************************************************

New login user name :"""

PASSWORD_TEXT = """New login password  :"""

LINE_TEXT = """
****************************************************************************
"""

FOOTER_TEXT = """
****************************************************************************

THE login USER NAME AND PASSWORDS HAVE BEEN CHANGED, RELOAD YOUR BROWSER 
FOR THIS TO TAKE EFFECT."""

def reset():  
    """
    Resets the config password ot 'kmotion'
    
    args    :   
    excepts : 
    return  : none
    """
    
    print CHANGE_TEXT,
    raw_ip = raw_input()
    if raw_ip != 'change':
        raise exit_('Change aborted')
        
    print LINE_TEXT
         
    # check we are running as root
    checking('Checking changer is running as root')
    uid = os.getuid()
    if uid != 0:
        fail()
        raise exit_('The changer must be run as root')
    ok()
    
    # check we can read ./kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking changer is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion root directory before running the changer')
    ok()

    # if we are in the root dir set kmotion_dir
    kmotion_dir = os.getcwd()
    
    print UNAME_TEXT,
    uname = raw_input()
    if len(uname) < 2:
        raise exit_('User name is too short, must be at least 2 characters')
    
    print PASSWORD_TEXT,
    password = raw_input()
    if len(password) < 4:
        raise exit_('Password too short, must be at least 4 characters')
    
    print LINE_TEXT
    
    checking('Changing user name and password')
    # creates 'users_digest' and leaves it as user root, not an issue
    
    stderr = Popen('htpasswd -bc %s/www/passwords/users_digest %s %s' % 
                   (kmotion_dir, uname, password), stderr=PIPE, shell=True).communicate()
    
    # special case for Suse, it uses 'htpasswd2'
    if stderr[1][:15] != 'Adding password for':
        Popen('htpasswd2 -bc %s/www/passwords/users_digest %s %s' % 
              (kmotion_dir, uname, password), shell=True)
    ok()
    
    checking('Restarting apache2')
    ok()
    # os.system used deliberately as it dumps output to term real time
    os.system('/etc/init.d/apache2 restart') 
    checking('Waiting for apache2 to init processes ... please wait')
    ok()
    time.sleep(10)

    print FOOTER_TEXT
    print LINE_TEXT

    
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
    reset()
except exit_, text:
    print '\n%s\n' % text
    
    