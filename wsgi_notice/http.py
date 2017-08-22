# -*- coding: utf-8 -*-

import os


class Http():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env
        self.pipe_file = os.path.join(self.kmotion_dir, 'www/fifo_motion_detector')

    def main(self):
        with open(self.pipe_file, 'wb') as pipein:
            pipein.write("{0}\n".format(self.env['REMOTE_ADDR']))
        return ''
