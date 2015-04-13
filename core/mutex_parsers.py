'''
Created on 18.12.2014

@author: demon
'''
import ConfigParser, sort_rc, os
from mutex import Mutex


def mutex_www_parser_wr(kmotion_dir, parser, www_rc='www_rc'):
    """
    Safely write a parser instance to 'www_rc' under mutex control.
 
    args    : kmotion_dir ... the 'root' directory of kmotion
        parser      ... the parser instance 
        excepts : 
        return  : 
    """
    www_rc_mutex = Mutex(kmotion_dir, www_rc)
    www_rc_file = '%s/www/%s' % (kmotion_dir, www_rc)
    www_rc_mutex.acquire()
    try:
        with open(www_rc_file, 'w') as f_obj:
            parser.write(f_obj)
        sort_rc.sort_rc(www_rc_file) 
    finally:
        www_rc_mutex.release()

def mutex_kmotion_parser_wr(kmotion_dir, parser):
    """
    Safely write a parser instance to 'core_rc' under mutex control.
   
        args    : kmotion_dir ... the 'root' directory of kmotion
              parser      ... the parser instance 
        excepts : 
        return  : 
    """
    kmotion_rc_mutex = Mutex(kmotion_dir, 'kmotion_rc')
    kmotion_rc_file = os.path.join(kmotion_dir, 'kmotion_rc')
    kmotion_rc_mutex.acquire()
    try:            
        with open(kmotion_rc_file, 'w') as f_obj: 
            parser.write(f_obj)
        sort_rc.sort_rc(kmotion_rc_file)
    finally:
        kmotion_rc_mutex.release()
        

def mutex_www_parser_rd(kmotion_dir, www_rc='www_rc'):
    """
        Safely generate a parser instance and under mutex control read 'www_rc'
        returning the parser instance.
    
        args    : kmotion_dir ... the 'root' directory of kmotion   
        excepts : 
        return  : parser ... a parser instance
        """
        
    parser = ConfigParser.SafeConfigParser()
    www_rc_mutex = Mutex(kmotion_dir, www_rc)
    www_rc_mutex.acquire()
    try:
        parser.read('%s/www/%s' % (kmotion_dir, www_rc))
    finally:
        www_rc_mutex.release()
    return parser

def mutex_kmotion_parser_rd(kmotion_dir):
    """
    Safely generate a parser instance and under mutex control read 'kmotion_rc'
    returning the parser instance.
    
    args    : kmotion_dir ... the 'root' directory of kmotion   
    excepts : 
    return  : parser ... a parser instance
    """
    
    parser = ConfigParser.SafeConfigParser()
    kmotion_rc_mutex = Mutex(kmotion_dir, 'kmotion_rc')
    kmotion_rc_mutex.acquire()
    try:        
        parser.read('%s/kmotion_rc' % kmotion_dir)
    finally:
        kmotion_rc_mutex.release()
    return parser

