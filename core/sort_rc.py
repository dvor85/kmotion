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

    f_obj = open(file_rc, 'r+')
    
    for line in [line.rstrip() for line in f_obj]:
        if line == '': continue
        if len(line) > 2 and line[0] == '[' and line[-1] == ']' and line != section:
            section = line
            sections[section] = []
            continue
        sections[section].append(line)
        
    keys = sections.keys()
    keys.sort()
    f_obj.seek(0)
    
    for section in keys:
        print >> f_obj, section
        sections[section].sort()
        for option in sections[section]:
            print >> f_obj, option
        print >> f_obj, ''
    f_obj.truncate() 
    f_obj.close()
            
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    