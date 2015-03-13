import os, sys, time, random, json
from cgi import parse_qs, escape

class Outs():
    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = parse_qs(self.environ['QUERY_STRING'])
        
    def main(self):        
        with open('%s/www/motion_out' % self.kmotion_dir) as f_obj:
            data = f_obj.read()
    
        return json.dumps(data)


