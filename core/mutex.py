 
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
Export mutex lock functions for the '../www/mutex/' files
"""

import os, random, time
import logger

log_level = 'WARNING'
logger = logger.Logger('mutex', log_level)


def init_mutex(kmotion_dir, mutex):
    """ 
    Reset the 'mutex' mutex by deleteing all locks
    
    args    : 
    excepts : 
    return  : none
    """
    
    logger.log('init_mutex() - init mutex : %s' % mutex, 'DEBUG')
    files = os.listdir('%s/www/mutex/%s' % (kmotion_dir, mutex))
    files.sort()
    if len(files) > 0 and files[0] == '.svn': # strip the .svn dir
        files = files[1:]
    for del_file in files:
        os.remove('%s/www/mutex/%s/%s' % (kmotion_dir, mutex, del_file))
     
        
def acquire(kmotion_dir, mutex):
    """ 
    Aquire the 'mutex' mutex lock, very carefully
    
    args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutex
    excepts : 
    return  : none
    """
    
    while True:
        # wait for any other locks to go
        while True:
            if check_lock(kmotion_dir, mutex) == 0:
                break
            time.sleep(0.01)
        
        # add our lock
        f_obj = open('%s/www/mutex/%s/%s' % (kmotion_dir, mutex, os.getpid()), 'w')
        f_obj.close()
            
        # wait ... see if another lock has appeared, if so remove our lock
        # and loop
        time.sleep(0.1)
        if check_lock(kmotion_dir, mutex) == 1:
            break
        os.remove('%s/www/mutex/%s/%s' % (kmotion_dir, mutex, os.getpid()))
        # random to avoid mexican stand-offs
        time.sleep(float(random.randint(01, 40)) / 1000)
            
        
def release(kmotion_dir, mutex):
    """ 
    Release the 'mutex' mutex lock
    
    args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutex 
    excepts : 
    return  : none
    """
    
    if os.path.isfile('%s/www/mutex/%s/%s' % (kmotion_dir, mutex, os.getpid())):
        os.remove('%s/www/mutex/%s/%s' % (kmotion_dir, mutex, os.getpid()))
       
        
def check_lock(kmotion_dir, mutex):
    """
    Return the number of active locks on the 'mutex' mutex, filters out .svn
    
    args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutexkmotion_dir 
    excepts : 
    return  : num locks ... the number of active locks
    """
    
    files = os.listdir('%s/www/mutex/%s' % (kmotion_dir, mutex))
    files.sort()
    if len(files) > 0 and files[0] == '.svn': # strip the .svn dir
        files.pop(0)
    return len(files)
        
        