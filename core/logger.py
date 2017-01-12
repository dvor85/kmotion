#!/usr/bin/env python

# Copyright 2008 David Selby dave6502@googlemail.com

# This file is part of kmotion.

# kmotion is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# kmotion is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with kmotion.  If not, see <http://www.gnu.org/licenses/>.

"""
A workaround for the buggy syslog module - should not be necessary but nothing's perfect
"""


import syslog


class Logger:

    EMERG = 'EMERG'
    ALERT = 'ALERT'
    CRIT = 'CRIT'
    ERR = 'ERR'
    WARNING = 'WARNING'
    NOTICE = 'NOTICE'
    INFO = 'INFO'
    DEBUG = 'DEBUG'

    def __init__(self, ident, min_priority=None):
        """
        Given a identity string and a min priority string create a logger 
        instance. The priority string must be one of ...
        EMERG, ALERT, CRIT, ERR, WARNING, NOTICE, INFO, DEBUG

        args    : ident ...        loggers identity
                  min_priority ... min report priority EMERG, ALERT, CRIT, ERR, 
                                   WARNING, NOTICE, INFO or DEBUG
        excepts :
        return  : none
        """

        # 'min_priority' is the min priority level at which events will be sent
        # to syslog, it  must be one of ... EMERG, ALERT, CRIT, ERR, WARNING,
        # NOTICE, INFO, DEBUG
        self.case = {Logger.EMERG: syslog.LOG_EMERG,
                     Logger.ALERT: syslog.LOG_ALERT,
                     Logger.CRIT: syslog.LOG_CRIT,
                     Logger.ERR: syslog.LOG_ERR,
                     Logger.WARNING: syslog.LOG_WARNING,
                     Logger.NOTICE: syslog.LOG_NOTICE,
                     Logger.INFO: syslog.LOG_INFO,
                     Logger.DEBUG: syslog.LOG_DEBUG}
        self.ident = ident
        if min_priority is None:
            min_priority = Logger.NOTICE
        self.min_priority = min_priority

    def set_prority(self, min_priority):
        """
        Given the min priority string modify the classes min priority value. The
        priority string must be one of EMERG, ALERT, CRIT, ERR, WARNING, NOTICE,
        INFO, DEBUG

        args    : min_priority ... min report priority EMERG, ALERT, CRIT, ERR,
                                   WARNING, NOTICE, INFO or DEBUG
        excepts :
        return  : none
        """

        self.min_priority = min_priority

    def __call__(self, msg, priority=None):
        self.log(msg, priority)

    def log(self, msg, priority=None):
        """
        Log an message string with a certain priority string. If that priority
        is greater than the pre-defined min priority log the message to
        /var/log/messages.  The priority string must be one of EMERG, ALERT,
        CRIT, ERR, WARNING, NOTICE, INFO, DEBUG

        args    : msg ...      message to be logged
                  priority ... priority of the msg EMERG, ALERT, CRIT, ERR,
                               WARNING, NOTICE, INFO or DEBUG
        excepts :
        return  : none
        """
        # 'priority' is the actual level of the event, it must be one of ...
        # EMERG, ALERT, CRIT, ERR, WARNING, NOTICE, INFO, DEBUG
        # 'msg' will only be sent to syslog if 'priority' >= 'min_priority'

        # TODO: The Python syslog module is very broken - logging priorities are
        # ignored, this is a workaround ...
        if priority is None:
            priority = Logger.NOTICE
        msg = "{0}: [kmotion::{1}] {2}".format(priority, self.ident, msg)
        if self.case[priority] <= self.case[self.min_priority]:
            syslog.openlog(self.ident, syslog.LOG_PID)
            syslog.syslog(msg)
            syslog.closelog()

        # The Python code that should implement the above ...
        # syslog.openlog(self.ident , syslog.LOG_PID, (syslog.LOG_ALERT | syslog.LOG_USER))
        # syslog.setlogmask(syslog.LOG_UPTO(self.case[self.min_priority]))
        # syslog.syslog(msg)
        # syslog.closelog()

    def d(self, msg):
        self.log(msg, Logger.DEBUG)

    def w(self, msg):
        self.log(msg, Logger.WARNING)

    def e(self, msg):
        self.log(msg, Logger.CRIT)


if __name__ == "__main__":
    log = Logger('TEST', Logger.DEBUG)
    log.d('test')
