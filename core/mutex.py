
"""
Export mutex lock functions for the '../www/mutex/' files
"""

import os, random, time
import logger

log = logger.Logger('mutex', logger.Logger.WARNING)

class Mutex:
    
    def __init__(self, kmotion_dir, mutex):        
        self.kmotion_dir = kmotion_dir 
        self.mutex = mutex       
        log.d('init_mutex() - init mutex : %s' % self.mutex)
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
        for m in files:
            if not os.path.isdir(os.path.join('/proc', m)):
                try:
                    os.unlink(os.path.join(self.mutex_dir, m))
                except:
                    pass
            else:
                return True
                        
        return False
    
    
        
        
