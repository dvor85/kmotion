# -*- coding: utf-8 -*-
'''
Created on 18.12.2014

@author: demon
'''
import configparser
from core import sort_rc
from core.mutex import Mutex
from pathlib import Path


def mutex_www_parser_wr(kmotion_dir, parser, www_rc='www_rc'):
    """
    Safely write a parser instance to 'www_rc' under mutex control.

    args    : kmotion_dir ... the 'root' directory of kmotion
        parser      ... the parser instance
        excepts :
        return  :
    """
    www_rc_file = Path(kmotion_dir, 'www', www_rc)
    with Mutex(kmotion_dir, www_rc):
        with www_rc_file.open(mode='w') as f_obj:
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
    kmotion_rc_file = Path(kmotion_dir, 'kmotion_rc')
    with Mutex(kmotion_dir, 'kmotion_rc'):
        with kmotion_rc_file.open(mode='w') as f_obj:
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

    parser = configparser.ConfigParser()
    with Mutex(kmotion_dir, www_rc):
        parser.read(f'{kmotion_dir}/www/{www_rc}', encoding="utf-8")
    return parser


def mutex_kmotion_parser_rd(kmotion_dir):
    """
    Safely generate a parser instance and under mutex control read 'kmotion_rc'
    returning the parser instance.

    args    : kmotion_dir ... the 'root' directory of kmotion
    excepts :
    return  : parser ... a parser instance
    """

    parser = configparser.ConfigParser()
    with Mutex(kmotion_dir, 'kmotion_rc'):
        parser.read(f'{kmotion_dir}/kmotion_rc', encoding="utf-8")
    return parser
