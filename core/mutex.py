 
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
    
    def __init__(self, kmotion_dir, mutex):        
        self.log = logger.Logger('mutex', logger.WARNING)
        self.kmotion_dir = kmotion_dir 
        self.mutex = mutex       
        self.log('init_mutex() - init mutex : %s' % self.mutex, logger.DEBUG)
        self.mutex_dir = '%s/www/mutex/%s' % (self.kmotion_dir, self.mutex)
        if not os.path.isdir(self.mutex_dir):
            os.makedirs(self.mutex_dir, 0775)
        
        
    def acquire(self):
        """ 
        Aquire the 'mutex' mutex lock, very carefully
    
        args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutex
        excepts : 
        return  : none
        """
    
        
        # wait for any other locks to go
        while True:
            if not self.is_lock(): break
            time.sleep(0.01)
    
        # add our lock
        with open(os.path.join(self.mutex_dir, str(os.getpid())), 'w'):
            pass
            
            
        
    def release(self):
        """ 
        Release the 'mutex' mutex lock
    
        args    : kmotion_dir ... the 'root' directory of kmotion 
              mutex ...       the actual mutex 
        excepts : 
        return  : none
        """
        
        try:
            os.unlink(os.path.join(self.mutex_dir, str(os.getpid())))
        except:
            pass
       
        
    def is_lock(self):
    
        files = os.listdir(self.mutex_dir)
        files.sort()
        lock = False
        for m in files:
            if not os.path.isdir(os.path.join('/proc', m)):
                try:
                    os.unlink(os.path.join(self.mutex_dir, m))
                except:
                    pass
            else:
                lock = True
                        
        return lock
    
    
        
        
