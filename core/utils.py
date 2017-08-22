# -*- coding: utf-8 -*-
# from __future__ import unicode_literals

import os
import sys
from cgi import parse_qs, escape
from UserDict import UserDict
import re
import pwd
import string
import shutil


def add_userinfo(src_url, username, password):
    from urlparse import urlsplit

    url = urlsplit(src_url)
    params = {'scheme': url.scheme, 'hostname': url.hostname, 'path': url.path}
    if url.query == '':
        params['query'] = ''
    else:
        params['query'] = '?%s' % url.query
    if url.username is None:
        params['username'] = username
    else:
        params['username'] = url.username
    if url.password is None:
        params['password'] = password
    else:
        params['password'] = url.password
    if url.port is None:
        params['port'] = ''
    else:
        params['port'] = ':%i' % url.port
    return "{scheme}://{username}:{password}@{hostname}{port}{path}{query}".format(**params)


__re_denied = re.compile(ur'[^./\wА-яЁё-]|[./]{2}', re.UNICODE | re.LOCALE)
__re_spaces = re.compile(r'\s+')
fmt = string.Formatter().format


class QueryParam(UserDict):

    def __init__(self, environ, safe=False):
        self.safe = safe
        self.data = parse_qs(environ['QUERY_STRING'])
        if environ['REQUEST_METHOD'].upper() == 'POST':
            try:
                request_body_size = int(environ.get('CONTENT_LENGTH', 0))
            except (ValueError):
                request_body_size = 0
            self.data.update(
                parse_qs(environ['wsgi.input'].read(request_body_size)))

    def __getitem__(self, key):
        val = UserDict.__getitem__(self, key)[0]
        if self.safe:
            return safe_str(val)
        return escape(val)


def safe_str(s):
    res = s
    if not isinstance(res, unicode):
        res = res.decode('utf-8', errors='ignore')

    return utf(__re_denied.sub('', res))


def split(s, num=0):
    return __re_spaces.split(s, num)


def parse_str(s):
    try:
        return int(s)
    except:
        try:
            return float(s)
        except:
            if s.lower() == "true":
                return True
            elif s.lower() == "false":
                return False
    return s


def str2num(s):
    try:
        return int(s)
    except:
        try:
            return float(s)
        except:
            return 0


def uniq(seq):
    # order preserving
    noDupes = []
    [noDupes.append(i) for i in seq if i not in noDupes]
    return noDupes


def rListFiles(path):
    files = []
    for f in os.listdir(path):
        if os.path.isdir(os.path.join(path, f)):
            files += rListFiles(os.path.join(path, f))
        else:
            files.append(os.path.join(path, f))
    return files


def _get_uid(name):
    """Returns a gid, given a group name."""
    if name is None:
        return None
    try:
        result = pwd.getpwnam(name).pw_uid
    except AttributeError:
        result = None
    if result is not None:
        return result[2]
    return None


def _get_gid(name):
    """Returns a gid, given a group name."""
    if name is None:
        return None
    try:
        result = pwd.getpwnam(name).pw_gid
    except AttributeError:
        result = None
    if result is not None:
        return result[3]
    return None


def chown(path, user=None, group=None):
    """Change owner user and group of the given path.
    user and group can be the uid/gid or the user/group names, and in that case,
    they are converted to their respective uid/gid.
    """

    _user = user
    _group = group

    # -1 means don't change it
    if user is None:
        _user = -1
    # user can either be an int (the uid) or a string (the system username)
    elif isinstance(user, basestring):
        _user = _get_uid(user)
        if _user is None:
            raise LookupError("no such user: {!r}".format(user))

    if group is None:
        _group = -1
    elif not isinstance(group, int):
        _group = _get_gid(group)
        if _group is None:
            raise LookupError("no such group: {!r}".format(group))

    os.chown(path, _user, _group)


def makedirs(path, mode=0775, user=None, group=None):
    if not os.path.isdir(path):
        if not os.path.isdir(os.path.dirname(path)):
            makedirs(os.path.dirname(path), mode, user, group)

        os.mkdir(path)
        os.chmod(path, mode)
        chown(path, user, group)


def rmdir(path):
    shutil.rmtree(path, ignore_errors=True)
    return not os.path.exists(path)


def uni(path):
    if isinstance(path, str):
        path = path.decode(sys.getfilesystemencoding(), errors='ignore')
    return path


def utf(path):
    if isinstance(path, unicode):
        return path.encode('utf8', errors='ignore')
    return path


def true_enc(path):
    if sys.platform.startswith('win'):
        return uni(path)
    return utf(path)


def get_user_name():
    __env_var = 'USER'
    if sys.platform.startswith('win'):
        __env_var = 'USERNAME'
    return true_enc(os.getenv(__env_var))


def get_comp_name():
    __env_var = 'HOSTNAME'
    if sys.platform.startswith('win'):
        __env_var = 'COMPUTERNAME'
    return true_enc(os.getenv(__env_var))


def get_data_dir():
    __env_var = 'HOME'
    if sys.platform.startswith('win'):
        __env_var = 'APPDATA'
    return true_enc(os.getenv(__env_var))
