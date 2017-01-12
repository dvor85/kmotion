import os
import sys
try:
    import simplejson as json
except:
    import json


class Outs():

    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.environ = environ

    def main(self):
        with open(os.path.join(self.kmotion_dir, 'www/motion_out'), 'r') as f_obj:
            lines = f_obj.read().splitlines()

        if len(lines) > 500:
            lines = lines[-500:]

        return json.dumps(lines)
