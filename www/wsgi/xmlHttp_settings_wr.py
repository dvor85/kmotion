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
Feed the POST'd value to the named pipe 'fifo_settings_wr'
"""

import os, os.path


def index(req):
    """
    Feed the POST'd 'dblob' to the named pipe 'fifo_settings_wr'
    
    args    : req
    excepts : 
    return  : none 
    """
     
    file_path = str(req.__getattribute__('filename'))
    www_dir = os.path.abspath('%s/../../..' % file_path)
    
    user=req.user    
    dblob = req.form.getfirst('dblob', '')
    #dblob.replace('$usr:%CURRENT_USER%','$usr:%s' % user)
    #coded_len = len(dblob).zfill(8)
    #dblob.join('$chk:%s' % coded_len)
    pipeout = os.open('%s/fifo_settings_wr' % www_dir, os.O_WRONLY)
    os.write(pipeout, dblob)
    os.close(pipeout)


# Module self test
if __name__ == '__main__':
    print '\nNo self test avaliable ...\n'








