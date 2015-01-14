 
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

class Mutex:
    
    log_level = 'WARNING'
    def __init__(self, kmotion_dir, mutex):        
        self.logger = logger.Logger('mutex', Mutex.log_level)
        self.kmotion_dir = kmotion_dir 
        self.mutex = mutex       
        self.logger.log('init_mutex() - init mutex : %s' % self.mutex, 'DEBUG')
        self.mutex_dir = '%s/www/mutex/%s' % (self.kmotion_dir, self.mutex)
        if not os.path.isdir(self.mutex_dir):
            os.makedirs(self.mutex_dir, 0755)
        files = os.listdir(self.mutex_dir)
        files.sort()
        
        for del_file in files:
            os.remove('%s/%s' % (self.mutex_dir, del_file))


    def acquire(self):
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
                if self.check_lock() == 0:
                    break
                time.sleep(0.01)
        
            # add our lock
            with open('%s/%s' % (self.mutex_dir, os.getpid()), 'w'):
                pass
            
            # wait ... see if another lock has appeared, if so remove our lock
            # and loop
            time.sleep(0.1)
            if self.check_lock() == 1:
                break
            os.remove('%s/%s' % (self.mutex_dir, os.getpid()))
            # random to avoid mexican stand-offs
            time.sleep(float(random.randint(01, 40)) / 1000)
            
        
    def release(self):
        """ 
        Release the 'mutex' mutex lock
    
        args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutex 
        excepts : 
        return  : none
        """

        if os.path.isfile('%s/%s' % (self.mutex_dir, os.getpid())):
            os.remove('%s/%s' % (self.mutex_dir, os.getpid()))
       
        
    def check_lock(self):
        """
        Return the number of active locks on the 'mutex' mutex, filters out .svn
    
        args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutexkmotion_dir 
        excepts : 
        return  : num locks ... the number of active locks
        """
    
        files = os.listdir(self.mutex_dir)
        files.sort()
        
        return len(files)
    
    
        
        