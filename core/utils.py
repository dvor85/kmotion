from cgi import parse_qs, escape
from UserDict import UserDict
import shutil
import os


class Request(UserDict):

    def __init__(self, env):

        self.data = parse_qs(env['QUERY_STRING'])
        if env['REQUEST_METHOD'].upper() == 'POST':
            try:
                request_body_size = int(env.get('CONTENT_LENGTH', 0))
            except (ValueError):
                request_body_size = 0
            self.data.update(parse_qs(env['wsgi.input'].read(request_body_size)))

    def __getitem__(self, key):
        return escape(UserDict.__getitem__(self, key)[0])


def parseStr(s):
    try:
        return int(s)
    except Exception:
        try:
            return float(s)
        except Exception:
            if s.lower() == "true":
                return True
            elif s.lower() == "false":
                return False
    return s


def uniq(seq):
    # order preserving
    noDupes = []
    [noDupes.append(i) for i in seq if noDupes.count(i) == 0]
    return noDupes


def rmdir(path):
    shutil.rmtree(path, ignore_errors=True)
    return not os.path.exists(path)


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
