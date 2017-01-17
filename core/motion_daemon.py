'''
@author: demon
'''
import logger
import os
import time
import subprocess
import sys
import traceback
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
        self.active = False
        self.daemon = True
        self.kmotion_dir = kmotion_dir
        self.init_motion = InitMotion(self.kmotion_dir)
        self.motion_daemon = None
        self.stop_motion()

    def count_motion_running(self):
        p_obj = subprocess.Popen('pgrep -f "^motion.+-c.*"', shell=True, stdout=subprocess.PIPE)
        return len(p_obj.communicate()[0].splitlines())

    def is_port_alive(self, port):
        p_obj = subprocess.Popen('netstat -ntl | grep %i' % port, shell=True, stdout=subprocess.PIPE)
        return p_obj.communicate()[0] != ''

    def start_motion(self):
        # check for a 'motion.conf' file before starting 'motion'

        self.init_motion.gen_motion_configs()
        if os.path.isfile('%s/core/motion_conf/motion.conf' % self.kmotion_dir):
            #             self.init_motion.init_motion_out()  # clear 'motion_out'
            log('starting motion')
            self.motion_daemon = subprocess.Popen(
                ['motion', '-c', '{kmotion_dir}/core/motion_conf/motion.conf'.format(kmotion_dir=self.kmotion_dir)],
                close_fds=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                shell=False)
            motion_out = os.path.join(self.kmotion_dir, 'www/motion_out')
            subprocess.Popen('grep --line-buffered -v "saved to"',
                             shell=True,
                             close_fds=True,
                             stdout=open(motion_out, 'w'),
                             stderr=subprocess.STDOUT,
                             stdin=self.motion_daemon.stdout)
        else:
            log.e('no motion.conf, motion not active')

    def stop(self):
        log.d('stop {name}'.format(name=__name__))
        self.active = False
        self.stop_motion()

    def stop_motion(self):
        if self.motion_daemon is not None:
            log.d('kill motion daemon')
            self.motion_daemon.kill()
            self.motion_daemon = None

        subprocess.call('pkill -f "^motion.+-c.*"', shell=True)
        while self.count_motion_running() > 0:
            subprocess.call('pkill -9 -f "^motion.+-c.*"', shell=True)
            self.sleep(2)

        log('motion killed')

    def run(self):
        """
        args    :
        excepts :
        return  : none
        """
        self.active = True
        while self.active:
            try:
                if not self.is_port_alive(8080):
                    self.stop_motion()
                if self.count_motion_running() != 1:
                    self.stop_motion()
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

            self.sleep(60)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active
