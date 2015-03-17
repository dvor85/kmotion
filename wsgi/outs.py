import os, sys, json
from cgi import parse_qs

class Outs():
    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = parse_qs(self.environ['QUERY_STRING'])
        
    def main(self):        
        with open(os.path.join(self.kmotion_dir, 'www/motion_out')) as f_obj:
            data = f_obj.read()
    
        return json.dumps(data)


