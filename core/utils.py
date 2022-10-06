# -*- coding: utf-8 -*-

import os
import sys
import re
import pwd
import shutil
import urllib.parse
from pathlib import Path


__re_denied = re.compile(r'[^./\wА-яЁё-]|[./]{2}')
__re_spaces = re.compile(r'\s+')


def url_add_auth(url, auth):
    parts = urllib.parse.urlparse(url)
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


def _get_uid(name):
    """Returns a gid, given a group name."""
    if name is None:
        return None
    try:
        result = pwd.getpwnam(name).pw_uid
    except AttributeError:
        result = None
    if result is not None:
        return result
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
        return result
    return None


def get_dir_size(path):
    path = Path(path)
    return sum(p.stat().st_size for p in path.rglob('*') if p.is_file())


def rmdir(path):
    path = Path(path)
    shutil.rmtree(path.as_posix())
    return not path.exists()


def mkdir(path, mode=0o775, parents=True, exist_ok=True):
    path = Path(path)
    if not path.is_dir():
        m = os.umask(0o000)
        path.mkdir(mode=mode, parents=parents, exist_ok=exist_ok)
        os.umask(m)


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
    elif isinstance(user, str):
        _user = _get_uid(user)
        if _user is None:
            raise LookupError("no such user: {!r}".format(user))

    if group is None:
        _group = -1
    elif not isinstance(group, int):
        _group = _get_gid(group)
        if _group is None:
            raise LookupError("no such group: {!r}".format(group))

    path = Path(path)
    os.chown(path.as_posix(), _user, _group)


def uni(s, from_encoding='utf8'):
    """
    Декодирует строку из кодировки encoding
    :s: строка для декодирования
    :from_encoding: Кодировка из которой декодировать.
    :return: unicode
    """

    if isinstance(s, bytes):
        return s.decode(from_encoding, 'ignore')
    return str(s)


def utf(s, to_encoding='utf8'):
    """
    PY2 - Кодирует :s: в :to_encoding:
    """
    if isinstance(s, bytes):
        return s
    return str(s).encode(to_encoding, errors='ignore')


def sizeof_fmt(num, suffix="B"):
    for unit in ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"]:
        if abs(num) < 1024.0:
            return f"{num:3.1f}{unit}{suffix}"
        num /= 1024.0
    return f"{num:.1f}Yi{suffix}"


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
