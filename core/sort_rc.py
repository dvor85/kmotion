#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from pathlib import Path

"""
Sorts a '_rc' file into alphabetical order
"""


def sort_rc(file_rc):
    """
    A script to sort ConfigParser generated configs into alphabetical order.
    The default order appears to be random (yuk!)

    NOTE Sequential counts should be zero filled ie line00, line01 etc ...

    args    : file_rc ... the full path and filename of the config file
    excepts :
    return  : none
    """

    section = ''
    sections = {}
    if not isinstance(file_rc, Path):
        file_rc = Path(file_rc)

    with file_rc.open(mode='r+') as f_obj:
        for line in [line.rstrip() for line in f_obj]:
            if line == '':
                continue
            if len(line) > 2 and line[0] == '[' and line[-1] == ']' and line != section:
                section = line
                sections[section] = []
                continue
            sections[section].append(line)

        keys = list(sections.keys())
        keys.sort()
        f_obj.seek(0)

        for section in keys:
            f_obj.write(f'\n{section}\n')
            sections[section].sort()
            for option in sections[section]:
                f_obj.write(f"{option}\n")
        f_obj.truncate()
