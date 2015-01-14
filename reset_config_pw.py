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
Resets the config password to 'kmotion'
"""

import os
from core.mutex_parsers import *

class exit_(Exception): pass

RESET_TEXT = """
****************************************************************************

Welcome to the kmotion v2 config password reset. If this code fails 
please file a bug at http://code.google.com/p/kmotion-v2-code/issues/list 
with full details so kmotion can be improved.

****************************************************************************

This script will reset the config password to its default 'kmotion'

Type \'reset\' to reset :"""

LINE_TEXT = """
****************************************************************************
"""

FOOTER_TEXT = """
****************************************************************************

THE CONFIG PASSWORD HAS BEEN RESET, RELOAD YOUR BROWSER AND THE CONFIG
PASSWORD WILL NOW BE 'kmotion'."""

def reset():  
    """
    Resets the config password to 'kmotion'
    
    args    :   
    excepts : 
    return  : none
    """
    
    print RESET_TEXT,
    raw_ip = raw_input()
    if raw_ip != 'reset':
        raise exit_('Reset aborted')
        
    print LINE_TEXT
         
    # check we are not running as root
    checking('Checking reset is running as a normal user')
    uid = os.getuid()
    if uid == 0:
        fail()
        raise exit_('The reset must be run as a normal user')
    ok()
    
    # check we can read ./kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking reset is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion root directory before running the reset')
    ok()

    # if we are in the root dir set kmotion_dir
    kmotion_dir = os.getcwd()
    
    checking('Reading configuration')
    parser = mutex_www_parser_rd(kmotion_dir)
    ok()
    
    checking('Resetting \'misc3_config_hash\'')
    parser.set('misc', 'misc3_config_hash', '107109111116105111110')
    ok()
    
    checking('Writing configuration')
    mutex_www_parser_wr(kmotion_dir, parser)
    ok()

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
    
    