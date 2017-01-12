#!/usr/bin/env python

import os
import sys


def usage():
    print "{0} <feed>".format(os.path.basename(__file__))


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    sys.path.append(kmotion_dir)
    from core.camera_lost import CameraLost
    feed = ''
    if len(sys.argv) > 1:
        feed = sys.argv[1]
        cam_lost = CameraLost(kmotion_dir, feed)
        if cam_lost.reboot_camera():
            sys.exit()
    else:
        usage()

    sys.exit(1)
