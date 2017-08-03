import os
import sys
try:
    import simplejson as json
except ImportError:
    import json


class Logs():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.env = env

    def main(self):
        from core.mutex import Mutex
        with Mutex(self.kmotion_dir, 'logs'):
            with open(os.path.join(self.kmotion_dir, 'www/logs'), 'r') as f_obj:
                lines = f_obj.read().splitlines()

            if len(lines) > 500:
                lines = lines[-500:]

        return json.dumps(lines)
