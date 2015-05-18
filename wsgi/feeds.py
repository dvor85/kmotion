
import os, sys, json

class Feeds():
    
    def __init__(self, kmotion_dir, environ):       
        sys.path.append(kmotion_dir) 
        from core.utils import Request
        self.kmotion_dir = kmotion_dir 
        self.environ = environ
        self.params = Request(environ)
        self.ramdisk_dir = self.params['rdd']
    
    def main(self):
        
        events = os.listdir(os.path.join(self.ramdisk_dir, 'events'))
        events.sort()
                            
        return json.dumps(events)
        
        
























