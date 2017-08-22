# -*- coding: utf-8 -*-

import os
import sys


class Outs():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.env = env

    def __call__(self, *args, **kwargs):
        with open(os.path.join(self.kmotion_dir, 'www/motion_out'), 'r') as f_obj:
            lines = f_obj.read().splitlines()

        if len(lines) > 500:
            lines = lines[-500:]

        return lines
