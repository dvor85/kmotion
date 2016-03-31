'''
@author: demon
'''
import logger, os, time, subprocess, sys, traceback
from init_motion import InitMotion
from multiprocessing import Process



log = logger.Logger('motion_daemon', logger.Logger.DEBUG)


class MotionDaemon(Process):
    '''
    classdocs
    '''
    def __init__(self, kmotion_dir):
        '''
        Constructor
        '''
        Process.__init__(self)
        self.name = 'motion_daemon'
        self.started = True
        self.kmotion_dir = kmotion_dir
        self.init_motion = InitMotion(self.kmotion_dir)
        self.motion_daemon = None
        self.stop_motion()
        
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
#             self.init_motion.init_motion_out()  # clear 'motion_out'
            log('starting motion')
            self.motion_daemon = subprocess.Popen(['motion', '-c', '{kmotion_dir}/core/motion_conf/motion.conf'.format(**{'kmotion_dir':self.kmotion_dir})], shell=False)
        else:
            log.e('no motion.conf, motion not started') 

            
    def stop_motion(self):  
        if not self.motion_daemon is None:
            self.motion_daemon.kill()
            self.motion_daemon = None      
        subprocess.call('pkill -f ".*motion.+-c.*"', shell=True)  # if motion hangs get nasty !
        if self.is_motion_running():
            log.d('resorting to kill -9 ... ouch !')
            subprocess.call('pkill -9 -f ".*motion.+-c.*"', shell=True)  # if motion hangs get nasty !
        
        log('motion killed') 
        
    def run(self):
        """
        args    : 
        excepts : 
        return  : none
        """
        self.started = True        
        while self.started:
            try:
                if not self.is_port_alive(8080):
                    self.stop_motion()
                if not self.is_motion_running():
                    self.start_motion()
                    
#                 raise Exception('motion killed')             

            except:  # global exception catch        
                exc_type, exc_value, exc_tb = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_tb)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                log.e('** CRITICAL ERROR ** crash - type: %s' % exc_type)
                log.e('** CRITICAL ERROR ** crash - value: %s' % exc_value)
                log.e('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc1)
                log.e('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc2) 
                del(exc_tb)
                
            if self.started:    
                time.sleep(60)
                
    def stop(self):
        self.started = False
        self.stop_motion()
        
        
    
        
        
