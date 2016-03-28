#!/bin/sh

### BEGIN INIT INFO
# Provides:          kmotion
# Required-Start:    $network $local_fs $remote_fs $syslog
# Required-Stop:     
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: 
### END INIT INFO


PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
kmotion=/usr/local/bin/kmotion
case "$1" in
*start)
    sudo -u videouser $kmotion
    ;;
stop)
    sudo -u videouser $kmotion stop
    ;;
*)
    echo "Usage: <start|stop>"
    ;;
esac

exit 0
