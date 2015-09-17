'''
@author: demon
'''
import logger, os, time, subprocess
from init_motion import InitMotion


log = logger.Logger('motion_daemon', logger.Logger.DEBUG)


class MotionDaemon:
    '''
    classdocs
    '''
    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        self.kmotion_dir = kmotion_dir
        self.init_motion = InitMotion(self.kmotion_dir)
        
    def is_motion_running(self):
        p_obj = subprocess.Popen('pgrep -f "^motion.+-c.*"', shell=True, stdout=subprocess.PIPE)
        return p_obj.communicate()[0] != ''
    
    def is_port_alive(self, port):
        p_obj = subprocess.Popen('netstat -ntl | grep %i' % port, shell=True, stdout=subprocess.PIPE)
        return p_obj.communicate()[0] != ''
    
    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'
        
        self.init_motion.gen_motion_configs()
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir):
            if not self.is_motion_running(): 
                self.init_motion.init_motion_out()  # clear 'motion_out'
                subprocess.Popen('while true; do test -z "$(pgrep -f \'^motion.+-c.*\')" -o -z "$(netstat -ntl | grep 8080)" && ( pkill -9 -f \'^motion.+-c.*\'; motion -c {kmotion_dir}/core/motion_conf/motion.conf 2>&1 | grep --line-buffered -v \'saved to\' | while read line; do echo "$(date \'+%Y.%m.%d %H:%M:%S\') $line" >> {kmotion_dir}/www/motion_out; done & ); sleep 2; done &'.format(**{'kmotion_dir':self.kmotion_dir}), shell=True)
                log('starting motion')
        else:
            log.e('no motion.conf, motion not started') 

            
    def stop_motion(self):        
        subprocess.call('pkill -f ".*motion.+-c.*"', shell=True)  # if motion hangs get nasty !
        if self.is_motion_running():
            log.d('resorting to kill -9 ... ouch !')
            subprocess.call('pkill -9 -f ".*motion.+-c.*"', shell=True)  # if motion hangs get nasty !
        
        log('motion killed') 
        
    
        
        
