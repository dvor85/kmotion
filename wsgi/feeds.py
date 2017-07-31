
import os
import sys
try:
    import simplejson as json
except ImportError:
    import json


class Feeds():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        from core.utils import Request
        self.kmotion_dir = kmotion_dir
        self.env = env
        self.params = Request(env)
        self.ramdisk_dir = self.params['rdd']

    def main(self):

        events = os.listdir(os.path.join(self.ramdisk_dir, 'events'))
        events.sort()

        return json.dumps(events)
