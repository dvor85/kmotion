# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import sys
import re
import pwd
import shutil
import six
from six.moves import urllib_parse


__re_denied = re.compile(r'[^./\wА-яЁё-]|[./]{2}')
__re_spaces = re.compile(r'\s+')


def url_add_auth(url, auth):
    parts = urllib_parse.urlparse(url)
    return parts._replace(netloc="{auth}@{netloc}".format(auth=":".join(auth), netloc=parts.netloc)).geturl()


def safe_str(s):
    return __re_denied.sub('', uni(s))


def split(s, num=0):
    return __re_spaces.split(s, num)


def parse_str(s):
    s = uni(s)
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
    path = uni(path)
    for f in map(uni, os.listdir(path)):
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
    elif isinstance(user, six.text_type):
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


def get_size(start_path='.'):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(start_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # skip if it is symbolic link
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)

    return total_size


def makedirs(path, mode=0o775, user=None, group=None):
    if not os.path.isdir(path):
        if not os.path.isdir(os.path.dirname(path)):
            makedirs(os.path.dirname(path), mode, user, group)
        try:
            os.mkdir(path)
            os.chmod(path, mode)
            chown(path, user, group)
        except Exception:
            pass


def rmdir(path):
    shutil.rmtree(path, ignore_errors=True)
    return not os.path.exists(path)


def uni(s, from_encoding='utf8'):
    """
    Декодирует строку из кодировки encoding
    :path: строка для декодирования
    :from_encoding: Кодировка из которой декодировать.
    :return: unicode path
    """

    if isinstance(s, six.binary_type):
        return s.decode(from_encoding, 'ignore')
    return s


def to_bytes(s, to_encoding='utf8'):
    """
    PY2 - Кодирует :s: в :to_encoding:
    """
    try:
        return six.ensure_binary(s, to_encoding, errors='ignore')
    except TypeError:
        try:
            return six.binary_type(s)
        except:
            return s


def get_user_name():
    __env_var = 'USER'
    if sys.platform.startswith('win'):
        __env_var = 'USERNAME'
    return os.getenv(__env_var)


def get_comp_name():
    __env_var = 'HOSTNAME'
    if sys.platform.startswith('win'):
        __env_var = 'COMPUTERNAME'
    return os.getenv(__env_var)


def get_data_dir():
    __env_var = 'HOME'
    if sys.platform.startswith('win'):
        __env_var = 'APPDATA'
    return os.getenv(__env_var)
