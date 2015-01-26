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
The auto installer
"""

import os, sys, pwd, grp, time, stat, ConfigParser, shutil
from subprocess import * # breaking habit of a lifetime !
import core.init_core   as init_core
import core.daemon_whip as daemon_whip

class exit_(Exception): pass

DEP_TEXT = """
****************************************************************************

Welcome to the kmotion v2 automatic installer. If this installer fails 
please file a bug at http://code.google.com/p/kmotion-v2-code/issues/list 
with full details so kmotion can be improved.

****************************************************************************

kmotion v2 has the following dependencies :

apache2 ...             v2.2.x 
apache2 python module   v3.3.x
motion ...              v3.2.x
python ...              v2.4.x

ssh ...                 vx.x.x (advised for remote server install)
ntp ...                 vx.x.x (advised for remote server install)
screen ...              vx.x.x (advised for remote server install)

If you are running Debian / Ubuntu or a derivative use the following command
apt-get install apache2 libapache2-mod-python motion python

Have the above dependencies been met (yes/no) ? (default yes) :"""

INSTALL_TEXT = """
****************************************************************************

This automatic installer will modify your system in the following ways :

(1) The 'kmotion' and 'kmotion_ptz' exes will be added to 'bin'
(2) A kmotion vhosts include will be added to 'apache2.conf'
(3) An @reboot 'kmotion start' will be added to 'crontab'

All of which are reversible manually or by executing uninstall.py.

**IMPORTANT** KMOTION USES MOTION AS PART OF ITS BACK END, YOU CANNOT USE 
MOTION INDEPENDENTLY IF YOU ARE USING KMOTION.

Type \'install\' to start install :"""

SELECT_USER = """
****************************************************************************

kmotion v2 runs as a service. Select the user who will run this service 
by typing the users name below. Please ensure that the selected user has 
sufficient authority to execute kmotion in its current location. 

This would normally be the current user unless you are root !

Avaliable users are :"""

LINE_TEXT = """
****************************************************************************
"""

FOOTER_TEXT = """
****************************************************************************

PORT                : %s
IMAGES DIRECTORY    : %s
MAX IMAGES DIR SIZE : %s GB
LDAP                : %s

TO CHANGE ANY OF THE ABOVE EDIT 'kmotion_rc'

FOR FURTHER CONFIGURATION DETAILS PLEASE REFER TO THE VIDEOS AT :
'http://kmotion.eu/mediawiki/index.php/Videos_v2'

****************************************************************************

INSTALLATION HAS FINISHED, REBOOT THE SYSTEM TO TEST THE AUTO START SCRIPT OR 
EXECUTE 'kmotion start'.

POINT YOUR BROWSER (HOPEFULLY FIREFOX) TO 'http://localhost:%s' OR 
'http://xx.xx.xx.xx:%s' THE DEFAULT USERNAME IS 'kmotion', THE DEFAULT 
PASSWORD IS 'kmotion'. 
"""


def install():  
    """
    The auto install script

    args    :   
    excepts : 
    return  : none
    """
    
    # ##########################################################################
    
    print DEP_TEXT,
    raw_ip = raw_input()
    if raw_ip != '' and raw_ip != 'yes':
        raise exit_('Please satisfy the above dependencies')
    
    # ##########################################################################
    
    print INSTALL_TEXT,
    if raw_input() != 'install':
        raise exit_('Install aborted')
    print LINE_TEXT

    # ##########################################################################
    
    # check we are running as root
    checking('Checking install is running as root')
    uid = os.getuid()
    if uid != 0:
        fail()
        raise exit_('The installer needs to be runs as root')
    ok()
    
    # ##########################################################################
    
    # check we can read ./kmotion_rc - if we can't, assume we are
    # not in the kmotion root directory
    checking('Checking installer is running in correct directory')
    if not os.path.isfile('./kmotion_rc'):
        fail()
        raise exit_('Please \'cd\' to the kmotion root directory before running the installer')
    ok()

    # if we are in the root dir set kmotion_dir
    kmotion_dir = os.getcwd()
    
    # check for existing motion instances
    checking('Checking for existing \'motion\' daemon instances')
    check_motion(kmotion_dir)
    ok()
    
    checking('Killing kmotion daemons')
    daemon_whip.stop()
    ok()
        
    # select a user to run the kmotion service
    checking('Searching for possible users to run kmotion service')
    ok()
    print SELECT_USER,
    users_uid = [[i[0], i[2], i[3]] for i in pwd.getpwall() if i[2] >= 500 or i[2] == 0]
    
    users = [i[0] for i in users_uid if i[0] != 'root' and i[0] != 'nobody']
    uid =   [i[1] for i in users_uid if i[0] != 'root' and i[0] != 'nobody']
    gid =   [i[2] for i in users_uid if i[0] != 'root' and i[0] != 'nobody']
    
    for user in users:
        print '\'%s\'' % user,
    print '\n\nType \'user\' to continue :',
    select = raw_input()
    
    if select not in users:
        raise exit_('Invalid user selected, Install aborted')
    kmotion_user = select
    kmotion_uid = uid[users.index(select)]
    kmotion_gid = gid[users.index(select)]
    
    # ##########################################################################
    
    # select ramdisk type
    df_out = Popen(['df'], stdout=PIPE).communicate()[0].split('\n')
    
    for line in df_out:
        split = line.split()
        
        if len(split) < 6: 
            continue
        
        #if False: # debug option to force 'virtual_ramdisk'
        if split[5] == '/dev/shm' and int(split[1]) > 30000:
            ramdisk_dir = '/dev/shm/kmotion_ramdisk'
            checking('Selected ramdisk ... /dev/shm')
            ok()
            break
            
    else:
        ramdisk_dir = '%s/www/virtual_ramdisk' % kmotion_dir
        checking('Selected virtual_ramdisk')
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
    
    # modifying 'apache2.conf'
    checking('Adding kmotion include to \'apache2.conf\'')
    try:
        modify_apache2(kmotion_dir)
    except exit_, text_:
        fail()
        raise exit_(text_)
    ok()
        
    # ##########################################################################
    
    checking('Apache2 restart')
    ok()
    restart_apache2()

    # ##########################################################################
    
    checking('Waiting for apache2 to init processes ... please wait')
    ok()
    time.sleep(5)

    # ##########################################################################
    
    apache2_group, apache2_gid = get_apache2_gid()
    checking('Searching for Apache2 group ... found \'%s\'' % apache2_group)
    ok()
    
    # ##########################################################################
    
    checking('Generating \'kmotion\' executable')
    init_core.gen_kmotion(kmotion_dir, kmotion_uid, kmotion_gid)
    ok()

    # ##########################################################################
    
    checking('Generating \'kmotion_ptz\' executable')
    init_core.gen_kmotion_ptz(kmotion_dir, kmotion_uid, kmotion_gid)
    ok()

    # ##########################################################################
    
    checking('Moving executables to \'bin\' directories')
    try:
        exe_path = move_exes(kmotion_dir)
    except exit_, text_:
        fail()
        raise exit_(text_)
    ok()
    
    # ##########################################################################
    
    checking('Adding @reboot to crontab')
    modify_crontab(kmotion_user, exe_path)
    ok()
    
    # ##########################################################################
    
    checking('Setting named pipes permissions')
    init_core.set_uid_gid_named_pipes(kmotion_dir, kmotion_uid, apache2_gid)
    ok()
    
    # ##########################################################################
    
    checking('Setting \'servo_state\' permissions')
    init_core.set_uid_gid_servo_state(kmotion_dir, kmotion_uid, apache2_gid)
    ok()
    
    # ##########################################################################
    
    checking('Setting mutex permissions')
    init_core.set_uid_gid_mutex(kmotion_dir, kmotion_uid, apache2_gid)
    ok()

    # ##########################################################################
    
    # kmotion not running, no need for mutex
    parser = ConfigParser.SafeConfigParser()
    parser.read('%s/kmotion_rc' % kmotion_dir)
    ldap = parser.get('LDAP', 'enabled')
    images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
    port = parser.get('misc', 'port')
    images_dbase_limit_gb = parser.get('storage', 'images_dbase_limit_gb')
    
    # ##########################################################################
    
    checking('Removing root pyc\'s')
    rm_root_pycs(kmotion_dir)
    ok()
    
    # ##########################################################################
    
    print FOOTER_TEXT % (port, images_dbase_dir, images_dbase_limit_gb, ldap, port, port),
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

    
def modify_apache2(kmotion_dir):
    """
    Locates apache2.conf, remove any previous include references, add kmotion
    include and comment

    args    : kmotion_dir ... the 'root' directory of kmotion
    excepts : exit_ ...       if apache2.conf can not be found
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
            f_obj.write('\n# Include kmotion vhosts directory\n')
            f_obj.write('Include %s/www/vhosts/kmotion\n' % kmotion_dir)
            f_obj.close()
            break
    else:
        raise exit_('Unable to locate : %s' % list_format(confs))

    
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
        #raise exit_('Unable to locate : %s' % list_format(apache2s))
    
            
def get_apache2_gid():     
    """
    Return apache2's group name and gid

    args    : 
    excepts : 
    return  : apache2's group name
              apache2's gid
    """
    
    # debian and derivatives
    if os.path.isfile('/etc/apache2/envvars'):
        f_obj = open('/etc/apache2/envvars')
        lines = f_obj.readlines()
        f_obj.close()
  
        for line in lines:
            split = line.split('=')
            if split[0] == 'export APACHE_RUN_GROUP':
                apache2_group = split[1].strip()
                break
        
    # suse
    elif os.path.isfile('/etc/apache2/uid.conf'):
        f_obj = open('/etc/apache2/uid.conf')
        lines = f_obj.readlines()
        f_obj.close()
  
        for line in lines:
            split = line.split(' ')
            if split[0] == 'Group':
                apache2_group = split[1].strip()
                break
    
    # slackware
    elif os.path.isfile('/etc/httpd/httpd.conf'):
        f_obj = open('/etc/httpd/httpd.conf')
        lines = f_obj.readlines()
        f_obj.close()
    
        for line in lines:
            split = line.split(' ')
            if split[0] == 'Group':
                apache2_group = split[1].strip()
                break
            
    return apache2_group, int(grp.getgrnam(apache2_group)[2])
                  

def move_exes(kmotion_dir):
    """
    Move bin files kmotion and kmotion_ptz to /usr/local/bin, /usr/bin or /bin 
    overwrite old version if they already exist

    args    : kmotion_dir ... the 'root' directory of kmotion
    excepts : exit_ ...       if neither /usr/local/bin, /usr/bin or /bin can be found
    return  : string ...      path to the executables
    """
    
    paths = ['/usr/local/bin', '/usr/bin', '/bin']
    for exe_path in paths:  
        if os.path.isdir(exe_path):    
            # os.rename replaced by os.system (move) because many home directories are 
            # on a differend partition rename only works within 1 partition
            # ....added by Gudy
            os_command_string = 'mv ' + kmotion_dir + '/kmotion ' +  exe_path + '/kmotion'
            os.system(os_command_string)
            os_command_string = 'mv '+ kmotion_dir + '/kmotion_ptz ' + exe_path + '/kmotion_ptz' 
            os.system( os_command_string)
            return exe_path

    raise exit_('Unable to locate : %s' % list_format(paths))


def modify_crontab(sel_user, exe_path):
    """
    Read users crontab, remove any previous references, add @reboot to start
    kmotion as a background process

    args    : sel_user ... the users that is to run kmotion
              exe_path ... the path to kmotion 
    excepts : 
    return  : none
    """

    # delete all existing @reboot kmotion lines in case installer called a 
    # second time with a different user selected
    for user in [i[0] for i in pwd.getpwall() if i[2] > 500 or i[2] == 0]:
        
        f_obj = os.popen('crontab -u %s -l' % user)
        ctab = f_obj.readlines()
        f_obj.close()
        
        if ctab == []: ctab = [''] # 'no crontab for ....'
        tmp = []
        for line in ctab:
            if not (line[:7] == '@reboot' and line[-17:] == '/kmotion start &\n'):
                tmp.append(line)

        f_obj = os.popen('crontab - -u %s' % user, 'w')
        f_obj.writelines(tmp)
        f_obj.close()
        
    f_obj = os.popen('crontab -u %s -l' % sel_user)
    ctab = f_obj.readlines()
    f_obj.close()

    f_obj = os.popen('crontab - -u %s' % sel_user, 'w')
    f_obj.writelines(ctab)
    f_obj.write('@reboot %s/kmotion start &\n' % exe_path)
    f_obj.close()



def rm_root_pycs(kmotion_dir):
    """
    Remove any root generated pyc's to allow normal users to generate fresh
    pyc's after any upgrades, helps performance.

    args    : kmotion_dir ... the 'root' directory of kmotion
    excepts : 
    return  : none
    """

    for pyc in [i for i in os.listdir('%s/core' % kmotion_dir) if i[-4:] == '.pyc']:
        os.remove('%s/core/%s' % (kmotion_dir, pyc))
        
    
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
