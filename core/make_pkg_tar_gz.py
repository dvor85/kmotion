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
This script generates a kmotion v2.xx package.
"""

import os, sys, shutil, subprocess, ConfigParser, shutil


def main():
    """
    This script generates a kmotion v2.xx package.

    args    : 
    excepts : 
    return  : 
    """
    
    print """
****************************************************************************

Welcome to the kmotion v2 automatic packaging script. If this upgrade fails 
on your system please email me at dave6502@googlemail.com with full details 
so this script can be improved.

****************************************************************************

This script generates a kmotion v2.xx package. *IMPORTANT* Check you have 
updated the version strings in kmotion_rc and www/templates/www_rc before 
running this script !

Do you want to continue (yes/no) ? (default yes) :""",
    
    user_ip = raw_input()
    
    print """
****************************************************************************
"""
    if not (user_ip == 'yes' or user_ip == ''):
        sys.exit()
        
    checking('Checking in latest SVN snapshot')
    ok()
    os.chdir('%s/..' % os.getcwd())
    subprocess.check_call('svn ci -m "making package ..."', shell = True)
    
    checking('Cleaning \'/tmp/kmotion_make_pkg\'')
    shutil.rmtree('/tmp/kmotion_make_pkg', True)
    ok()
        
    checking('Checking out latest SVN snapshot')
    ok()
    subprocess.check_call('svn checkout http://kmotion2.googlecode.com/svn/trunk/ /tmp/kmotion_make_pkg/kmotion', shell = True)
    
    checking('Cleaning directory tree')
    ok()
    for root, dirs, files in os.walk('/tmp/kmotion_make_pkg/kmotion'):
        
        for svn_dir in dirs:
            if svn_dir == '.svn':
                del_dir = os.path.join(root, svn_dir)
                checking('removing dir %s' % del_dir)
                shutil.rmtree(del_dir, True)
                ok()
        
                
    checking('Resetting kmotion_rc to template version')
    shutil.copy('/tmp/kmotion_make_pkg/kmotion/www/templates/kmotion_rc', '/tmp/kmotion_make_pkg/kmotion/kmotion_rc')
    ok()
                
    checking('Resetting www_rc to template version')
    shutil.copy('/tmp/kmotion_make_pkg/kmotion/www/templates/www_rc', '/tmp/kmotion_make_pkg/kmotion/www/www_rc')  
    ok()
    
    parser = ConfigParser.SafeConfigParser()
    parser.read('/tmp/kmotion_make_pkg/kmotion/kmotion_rc') 
    vers = parser.get('version', 'string')
        
    vers = vers.rstrip().replace(' ', '_')
                
    os.chdir('/tmp/kmotion_make_pkg') # no earlier because I am paranoid !
    checking('Generating kmotion_%s.tar.gz ...\n' % vers)
    ok()
    subprocess.check_call('tar -cvvaf kmotion_%s.tar.gz kmotion' % vers, shell = True)
        
    checking('Cleaning up & saving as /home/dave/Desktop/kmotion_%s.tar.gz' % vers)
    os.rename('/tmp/kmotion_make_pkg/kmotion_%s.tar.gz' % vers, '/home/dave/Desktop/kmotion_%s.tar.gz' % vers)
    ok()
    
    checking('Cleaning \'/tmp/kmotion_make_pkg\'')
    shutil.rmtree('/tmp/kmotion_make_pkg', True)
    ok()
        
    
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


    
if __name__ == '__main__':
    main()







