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
The automated uninstaller
"""

import os, pwd
from subprocess import * # breaking habit of a lifetime !

class exit_(Exception): pass

UNINSTALL_TEXT = """
****************************************************************************

Welcome to the kmotion v2 automatic ununstaller. If this uninstaller fails 
please file a bug at http://code.google.com/p/kmotion-v2-code/issues/list 
with full details so kmotion can be improved.

****************************************************************************

This universal uninstaller will modify your system in the following ways :

(1) The 'kmotion' and 'kmotion_ptz' exes will be removed from 'bin'
(2) The kmotion vhosts include will be removed from 'apache2.conf' 
(3) The @reboot kmotion start will be removed from 'crontab'

Type \'uninstall\' to start uninstall :"""

LINE_TEXT = """
****************************************************************************

"""

COMPLETION_TEXT = """
****************************************************************************

KMOTION HAS NOW BEEN UNINSTALLED

****************************************************************************
"""


def uninstall():  
    """
    The automated uninstall script  

    args    :   
    excepts : 
    return  : none
    """
    
    # ##########################################################################
    
    print UNINSTALL_TEXT,
    if raw_input() != 'uninstall':
        raise exit_('Uninstall aborted')
    print LINE_TEXT,

    # ##########################################################################
    
    # check we are running as root
    checking('Checking install is running as root')
    uid = os.getuid()
    if uid != 0:
        fail()
        raise exit_('The uninstaller needs to be run as root')
    ok()

    # ##########################################################################
    
    # check we can read ./kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking uninstaller is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion root directory before running the uninstaller')
    ok()

    # ##########################################################################
    
    checking('Removing \'kmotion\' and \'kmotion_ptz\' exes from \'bin\'')
    rm_exes()
    ok()

    # ##########################################################################
    
    checking('Removing kmotion vhost reference from \'apache2.conf\'')
    rm_apache2_include()
    ok()

    # ##########################################################################
    
    checking('Apache2 restart')
    ok()
    restart_apache2()

    # ##########################################################################
    
    checking('Removing @reboot from \'crontab\'')
    rm_crontab_boot()
    ok()

    print COMPLETION_TEXT


def rm_exes():
    """
    Remove kmotion and kmotion_reload bin files from /usr/local/bin, /usr/bin or /bin

    args    : 
    excepts :
    return  : none
    """
    
    paths = ['/usr/local/bin', '/usr/bin', '/bin']
    for exe_path in paths: 
        if os.path.isfile('%s/kmotion' % exe_path): os.remove('%s/kmotion' % exe_path)
        if os.path.isfile('%s/kmotion_ptz' % exe_path): os.remove('%s/kmotion_ptz' % exe_path)


def rm_apache2_include():
    """
    Locate apache2.conf and remove any kmotion include references

    args    : 
    excepts : 
    return  : none
    """
    
    confs = ['/etc/apache2/apache2.conf', '/etc/apache2/httpd.conf', 
             '/etc/httpd/conf/httpd.conf', '/etc/httpd/httpd.conf', 
             '/etc/apache2/default-server.conf']
    
    for conf in confs:  # coded this way to allow for different .conf files
        if os.path.isfile(conf):

            f_obj = open(conf)
            lines = f_obj.readlines()
            f_obj.close()
            
            for i in range(len(lines) - 1):
                if i >= len(lines): break  # 'del' will shorten the list length
                if (lines[i].rstrip() == '# Include kmotion vhosts directory' and
                    lines[i + 1][:7] == 'Include'):
                    del lines[i:i + 2]
            if lines[-1] == '\n': del lines[-1]  # strip off new line

            f_obj = open(conf, 'w')
            f_obj.writelines(lines)
            f_obj.close()
            break

        
def restart_apache2():
    """
    Restart the apache2 server

    args    : 
    excepts : 
    return  : 
    """
    
    if call(['which', 'apachectl']) == 1:
        call(['apache2ctl', 'restart']) 
        
    else:
        call(['apachectl', 'restart'])
        
    #apache2s = ['/etc/init.d/apache2', '/etc/init.d/httpd']
    #for apache2 in apache2s:  
        #if os.path.isfile(apache2):
            #print
            #os.system('%s restart' % apache2) # os.system used deliberately as 
                                              ## it dumps output to term real time
            #break
        
    #else:
        #raise exit_('Unable to locate : %s' % _list_format(apache2s))
    
    
def rm_crontab_boot():
    """
    Checks all users crontabs and removes any references to @reboot kmotion 

    args    :
    excepts : 
    return  : none
    """
    
    # How about: users = [ i[0] for i in pwd.getpwall() if i[2] > 500 ]   --
    # seems to work on all unix variants I have access to capable of running
    # Motion :) -- I'd make the groupid check >1000 but the pesky OSX uses
    # 501 for it's first user. Patch from Roman Gaufman
    for user in [i[0] for i in pwd.getpwall() if i[2] > 500 or i[2] == 0]:
        f_obj = os.popen('crontab -u %s -l' % user)
        ctab = f_obj.readlines()
        f_obj.close()
        
        # 'ctab == []' when no crontab for user
        if ctab == [] or ctab[0] == 'no crontab for %s' % user: continue
        tmp = []
        for line in ctab:
            if not (line[:7] == '@reboot' and line[-17:] == '/kmotion start &\n'):
                tmp.append(line)

        f_obj = os.popen('crontab -u %s -' % user, 'w')
        f_obj.writelines(tmp)
        f_obj.close()


def _list_format(list_):
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
    uninstall()
except exit_, text:
    print '\n%s\n' % text