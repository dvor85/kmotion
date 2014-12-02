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

    
    def __init__(self, ident, min_priority):
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
        self.case = {'EMERG': syslog.LOG_EMERG,
                            'ALERT': syslog.LOG_ALERT,
                            'CRIT': syslog.LOG_CRIT,
                            'ERR': syslog.LOG_ERR,
                            'WARNING': syslog.LOG_WARNING,
                            'NOTICE': syslog.LOG_NOTICE,
                            'INFO': syslog.LOG_INFO,
                            'DEBUG': syslog.LOG_DEBUG}
        self.ident = ident
        self.min_priority = min_priority       
    
        
    def set_prority(self,  min_priority):
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
    
        
    def log(self, msg, priority):
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
        if self.case[priority] <= self.case[self.min_priority]: 
            syslog.openlog(self.ident , syslog.LOG_PID) 
            syslog.syslog(msg)
            syslog.closelog()
        
        # The Python code that should implement the above ...
        #syslog.openlog(self.ident , syslog.LOG_PID, (syslog.LOG_ALERT | syslog.LOG_USER)) 
        #syslog.setlogmask(syslog.LOG_UPTO(self.case[self.min_priority]))
        #syslog.syslog(msg)
        #syslog.closelog()
        
        

