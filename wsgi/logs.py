import os, sys, json

class Logs():
    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)        
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        
    def main(self):        
        from core.mutex import Mutex
        logs_mutex = Mutex(self.kmotion_dir, 'logs')
        logs_mutex.acquire()
        try:                       
            with open(os.path.join(self.kmotion_dir, 'www/logs')) as f_obj:
                data = f_obj.read()
        finally:
            logs_mutex.release()
    
        return json.dumps(data)
        

