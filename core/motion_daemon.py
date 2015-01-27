'''
@author: demon
'''
from threading import Thread
import logger,os,time
from subprocess import *
from init_motion import InitMotion

class MotionDaemon():
    '''
    classdocs
    '''
    log_level = logger.WARNING
    
    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        self.kmotion_dir = kmotion_dir
        self.logger = logger.Logger('motion_daemon', MotionDaemon.log_level)
        self.init_motion = InitMotion(self.kmotion_dir)
        
    def is_motion_running(self):
        p_obj = Popen('pgrep -f "^motion.+-c.*"', shell=True, stdout=PIPE)
        return p_obj.communicate()[0] != ''
    
    def is_port_alive(self, port):
        p_obj = Popen('netstat -ntl | grep %i' % port, shell=True, stdout=PIPE)
        return p_obj.communicate()[0] != ''
    
    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'
        
        self.init_motion.gen_motion_configs()
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir):
            if not self.is_motion_running(): 
                self.init_motion.init_motion_out()  # clear 'motion_out'
                Popen('while true; do test -z "$(pgrep -f \'^motion.+-c.*\')" -o -z "$(netstat -ntl | grep 8080)" && ( pkill -9 -f \'^motion.+-c.*\'; motion -c {0}/core/motion_conf/motion.conf 2>&1 | grep --line-buffered -v \'saved to\' >> {0}/www/motion_out & ); sleep 2; done &'.format(self.kmotion_dir), shell=True)
                self.logger.log('starting motion', logger.CRIT)
        else:
            self.logger.log('no motion.conf, motion not started', logger.CRIT) 

            
    def stop_motion(self):        
        Popen('pkill -f ".*motion.+-c.*"', shell=True).wait()  # if motion hangs get nasty !
        if self.is_motion_running():
            self.logger.log('resorting to kill -9 ... ouch !', logger.DEBUG)
            Popen('pkill -9 -f ".*motion.+-c.*"', shell=True).wait()  # if motion hangs get nasty !
        
        self.logger.log('motion killed', logger.DEBUG) 
        
    
        
        