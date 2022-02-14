# -*- coding: utf-8 -*-

import logging
from logging.handlers import SysLogHandler, RotatingFileHandler
import sys


CRITICAL = 50
FATAL = CRITICAL
ERROR = 40
WARNING = 30
WARN = WARNING
INFO = 20
DEBUG = 10
NOTSET = 0


class WWWLogger(logging.Logger):

    def __init__(self, name, level=NOTSET):
        logging.Logger.__init__(self, name, level=level)

        f_format = logging.Formatter(fmt="%(asctime)-19s: %(levelname)s: %(message)s")
        f_handler = RotatingFileHandler('/var/log/kmotion/kmotion.log')
        f_handler.setFormatter(f_format)
        self.addHandler(f_handler)


class Logger(logging.Logger):

    def __init__(self, name, level=NOTSET):
        logging.Logger.__init__(self, name, level=level)

        # stream_format = logging.Formatter(fmt="%(asctime)-19s: %(name)s[%(module)s]: %(levelname)s: %(message)s")
        # stream_handler = logging.StreamHandler(stream=sys.stdout)
        # stream_handler.setFormatter(stream_format)
        # self.addHandler(stream_handler)

        syslog_format = logging.Formatter(fmt="%(name)s: %(levelname)s: [%(module)s]: %(message)s")
        syslog_handler = SysLogHandler(address='/dev/log')
        syslog_handler.setFormatter(syslog_format)
        self.addHandler(syslog_handler)


def getLogger(name, level=logging.NOTSET):
    """
    Returns the logger with the specified name.
    name       - The name of the logger to retrieve
    """
    if name == 'www_logs':
        logging.setLoggerClass(WWWLogger)
        log = logging.getLogger(name)
        log.setLevel(level)
    else:
        logging.setLoggerClass(Logger)
        log = logging.getLogger(name)
        log.setLevel(level)

    return log
