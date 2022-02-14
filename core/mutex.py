# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
"""
Export mutex lock functions for the '../www/mutex/' files
"""

import os
import time
from . import logger, utils

log = logger.getLogger('kmotion', logger.ERROR)


class Mutex():

    def __init__(self, kmotion_dir, mutex):
        self.kmotion_dir = kmotion_dir
        self.mutex = mutex
        log.debug('init_mutex() - init mutex : %s' % self.mutex)
        self.mutex_dir = '%s/www/mutex/%s' % (self.kmotion_dir, self.mutex)
        if not os.path.isdir(self.mutex_dir):
            utils.makedirs(self.mutex_dir)

    def acquire(self):
        """
        Aquire the 'mutex' mutex lock, very carefully

        args    : kmotion_dir ... the 'root' directory of kmotion
              mutex ...       the actual mutex
        excepts :
        return  : none
        """

        # wait for any other locks to go
        while True:
            if not self.is_lock():
                break
            time.sleep(0.01)

        # add our lock
        with open(os.path.join(self.mutex_dir, str(os.getpid())), 'w'):
            pass

    def release(self):
        """
        Release the 'mutex' mutex lock

        args    : kmotion_dir ... the 'root' directory of kmotion
              mutex ...       the actual mutex
        excepts :
        return  : none
        """

        try:
            os.unlink(os.path.join(self.mutex_dir, str(os.getpid())))
        except Exception:
            pass

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

    def is_lock(self):

        files = os.listdir(self.mutex_dir)
        files.sort()
        for m in files:
            if not os.path.isdir(os.path.join('/proc', m)):
                try:
                    os.unlink(os.path.join(self.mutex_dir, m))
                except Exception:
                    pass
            else:
                return True

        return False
