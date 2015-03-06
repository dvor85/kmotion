#!/usr/bin/env python


"""
Called by the kmotion exe file this module re-initialises the kmotion core then 
reloads the kmotion daemon configs

The kmotion exe file cannot call this code directly because it may be in a 
different working directory
"""

import os, sys, time, threading, signal, ConfigParser
import core.logger as logger
from subprocess import *  # breaking habit of a lifetime !
from core.mutex_parsers import *
from core.www_logs import WWWLog
from core.motion_daemon import MotionDaemon
from core.init_core import InitCore 
from core.kmotion_hkd1 import Kmotion_Hkd1
from core.kmotion_hkd2 import Kmotion_Hkd2
from core.kmotion_setd import Kmotion_setd
from core.kmotion_split import Kmotion_split


class exit_(Exception): pass

class Kmotion:
    
    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
      
        self.log = logger.Logger('main', logger.DEBUG)
        # signal.signal(signal.SIGTERM, self.signal_term)
        self.www_log = WWWLog(self.kmotion_dir)
        
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = parser.get('dirs', 'ramdisk_dir')
         
        self.init_core = InitCore(self.kmotion_dir)
        self.motion_daemon = MotionDaemon(self.kmotion_dir)
        
        self.daemons = []
        self.daemons.append(Kmotion_Hkd1(self.kmotion_dir))
        self.daemons.append(Kmotion_Hkd2(self.kmotion_dir))
        self.daemons.append(Kmotion_setd(self.kmotion_dir))
        self.daemons.append(Kmotion_split(self.kmotion_dir))
        
    def main(self, option):
        if option == 'stop':            
            self.stop()
        elif option == 'status':
            pass
        else:
            self.stop()
            self.start()
        
    def start(self):
        """ 
        Check and start all the kmotion daemons
    
        args    : 
        excepts : 
        return  : none
        """ 
        
        self.log('starting kmotion ...', logger.CRIT)
        
    
        # init the ramdisk dir
        self.init_core.init_ramdisk_dir()
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.init_core.update_rcs()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
        
        try:  # wrapping in a try - except because parsing data from kmotion_rc
            self.init_core.gen_vhost()
        except (ConfigParser.NoSectionError, ConfigParser.NoOptionError):
            raise exit_('corrupt \'kmotion_rc\' : %s' % sys.exc_info()[1])
    
        self.init_core.set_uid_gid_named_pipes(os.getuid(), os.getgid())
        
        self.log('starting daemons ...', logger.DEBUG)
        self.motion_daemon.start_motion()
        for d in self.daemons:
            d.start()
        self.log('daemons started...', logger.DEBUG)
            
        purge_str = '#' * 1000 + '99999999'
        for fifo in ['fifo_settings_wr']:
            with open(os.path.join(self.kmotion_dir, 'www', fifo), 'w') as pipeout:
                pipeout.write(purge_str)
                
        self.log('waiting daemons ...', logger.DEBUG)    
        self.wait_termination()


    def stop(self):
        """ 
        Kill all the kmotion daemons 
    
        args    : 
        excepts : 
        return  : none
        """
        self.log('stopping kmotion ...', logger.CRIT)
        self.log('killing daemons ...', logger.DEBUG)

        for pid in self.get_kmotion_pids():
            os.kill(int(pid), signal.SIGTERM) 
            
        self.motion_daemon.stop_motion()
        
        self.log('daemons killed ...', logger.DEBUG)
        self.www_log.add_shutdown_event()


    def get_kmotion_pids(self):
        p_objs = Popen('pgrep -f "^python.+%s.*"' % os.path.basename(__file__), shell=True, stdout=PIPE)  
        stdout = p_objs.communicate()[0]
        return [pid for pid in stdout.splitlines() if os.path.isdir(os.path.join('/proc', pid)) and pid != str(os.getpid())]
    
#                 
#     def signal_term(self, signum, frame):
#         print 'exit'        
#         #sys.exit()
    
    def wait_termination(self):
        for d in self.daemons:
            d.join()


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    option = ''
    if len(sys.argv) > 1:
        option = sys.argv[1]
    kmotion = Kmotion(kmotion_dir).main(option)

 


