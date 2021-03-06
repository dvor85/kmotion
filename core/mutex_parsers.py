'''
Created on 18.12.2014

@author: demon
'''
import ConfigParser
import sort_rc
import os
from mutex import Mutex


def mutex_www_parser_wr(kmotion_dir, parser, www_rc='www_rc'):
    """
    Safely write a parser instance to 'www_rc' under mutex control.

    args    : kmotion_dir ... the 'root' directory of kmotion
        parser      ... the parser instance 
        excepts :
        return  :
    """
    www_rc_file = '%s/www/%s' % (kmotion_dir, www_rc)
    with Mutex(kmotion_dir, www_rc):
        with open(www_rc_file, 'w') as f_obj:
            parser.write(f_obj)
        sort_rc.sort_rc(www_rc_file)


def mutex_kmotion_parser_wr(kmotion_dir, parser):
    """
    Safely write a parser instance to 'core_rc' under mutex control.

        args    : kmotion_dir ... the 'root' directory of kmotion
              parser      ... the parser instance
        excepts :
        return  :
    """
    kmotion_rc_file = os.path.join(kmotion_dir, 'kmotion_rc')
    with Mutex(kmotion_dir, 'kmotion_rc'):
        with open(kmotion_rc_file, 'w') as f_obj:
            parser.write(f_obj)
        sort_rc.sort_rc(kmotion_rc_file)


def mutex_www_parser_rd(kmotion_dir, www_rc='www_rc'):
    """
        Safely generate a parser instance and under mutex control read 'www_rc'
        returning the parser instance.

        args    : kmotion_dir ... the 'root' directory of kmotion
        excepts :
        return  : parser ... a parser instance
        """

    parser = ConfigParser.SafeConfigParser()
    with Mutex(kmotion_dir, www_rc):
        parser.read('%s/www/%s' % (kmotion_dir, www_rc))
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
    with Mutex(kmotion_dir, 'kmotion_rc'):
        parser.read('%s/kmotion_rc' % kmotion_dir)
    return parser
