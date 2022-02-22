# -*- coding: utf-8 -*-
"""
Export mutex lock functions for the '../www/mutex/' files
"""

import os
import time
from pathlib import Path
from core import logger


log = logger.getLogger('kmotion', logger.ERROR)


class Mutex():

    def __init__(self, kmotion_dir, mutex):
        self.kmotion_dir = kmotion_dir
        self.mutex = mutex
        log.debug(f'init_mutex() - init mutex : {self.mutex}')
        self.mutex_dir = Path(self.kmotion_dir, 'www', 'mutex', self.mutex)
        if not self.mutex_dir.is_dir():
            self.mutex_dir.mkdir(parents=True)

    def acquire(self, pid):
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
        Path(self.mutex_dir, str(pid)).touch()

    def release(self, pid):
        """
        Release the 'mutex' mutex lock

        args    : kmotion_dir ... the 'root' directory of kmotion
              mutex ...       the actual mutex
        excepts :
        return  : none
        """

        try:
            m = Path(self.mutex_dir, str(pid))
            if m.is_file():
                m.unlink()
        except Exception:
            pass

    def __enter__(self):
        self.acquire(os.getpid())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release(os.getpid())

    def is_lock(self):

        files = os.listdir(self.mutex_dir)
        files.sort()
        for m in files:
            if not Path('/proc', m).is_dir():
                self.release(m)
            else:
                return True

        return False
