#! /bin/sh
### BEGIN INIT INFO
# Provides:          kmotion
# Required-Start:    $syslog $remote_fs
# Required-Stop:     $syslog $remote_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: 
# Description: 
### END INIT INFO

DAEMON=/usr/local/kmotion3/kmotion.py
NAME=kmotion
PIDFILE=/var/run/$NAME/$NAME.pid
DESC="${NAME}"
USER=videouser

unset TMPDIR

test -x $DAEMON || exit 0

. /lib/lsb/init-functions

OPTIONS="--quiet --pidfile $PIDFILE"

do_start()
{
    mkdir -p `dirname "$PIDFILE"`
    start-stop-daemon --start --background $OPTIONS --make-pidfile --chuid $USER --startas $DAEMON
    return $?
}

do_stop()
{
    start-stop-daemon --stop --retry=TERM/30/KILL/5 $OPTIONS && rm -f $PIDFILE
    return $?
}

do_status()
{
    start-stop-daemon --status $OPTIONS
    return $?
}


case "$1" in
  start)
    log_begin_msg "Starting $DESC: $NAME"
	do_start
    log_end_msg $?
    ;;
  stop)
    log_begin_msg "Stopping $DESC: $NAME"
	do_stop
    log_end_msg $?
    ;;
  restart|force-reload)
    log_begin_msg "Restarting $DESC: $NAME"
    do_stop && do_start
    log_end_msg $?
    ;;
  status)
    log_begin_msg "Status $DESC: $NAME"
	do_status
    log_end_msg $?
	;;
  *)
    N=/etc/init.d/${0##*/}
    echo "Usage: $N {start|stop|force-reload|restart|status}" >&2
    exit 1
    ;;
esac

exit 0

