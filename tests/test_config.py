# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
'''
Created on 14 дек. 2021 г.

@author: demon
'''
import unittest
from core.config import Settings
import os


class TestConfig(unittest.TestCase):
    kmotion_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

    def test_kmotion_rc(self):
        print(self.kmotion_dir)
        cfg = Settings(self.kmotion_dir)
        rc = cfg.get('kmotion_rc')
        self.assertTrue(rc)

    def test_www_rc(self):
        print(self.kmotion_dir)
        cfg = Settings(self.kmotion_dir)
        rc = cfg.get('www_rc')
        self.assertTrue(rc)


if __name__ == "__main__":
    unittest.main()
