#!/bin/bash

SELF_NAME=$(basename $0)
[[ $(id -u) -eq 0 ]] && echo -e "\n$SELF_NAME cant be run as root\n" && exit 0

export kmotion_dir=`readlink -f "$(dirname $0)/../"`
. $kmotion_dir/core/ini;

ramdisk_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs ramdisk_dir);
interval=60
time_break=3

function logmsg
{
    [[ -n "$1" ]] && logger -t "kmotion" -i -p user.info "$1";
}

function break_video
{
    while true; do
	EVENTS_LIST=$(find $ramdisk_dir/events -type f -mmin +$time_break -printf "%P\n");
	mkdir -p $ramdisk_dir/states/;
	for event in $EVENTS_LIST; do
	    thread=$(printf %01.0f $event);
	    if [[ -s $ramdisk_dir/events/$event ]]; then
    		state_file=$ramdisk_dir/states/$event;
    		state=0;
		echo "state=1" > $state_file;
		
		event_end=$kmotion_dir/event/stop.sh;
		event_start=$kmotion_dir/event/start.sh;
		[[ -x $event_end ]] && ( logmsg "event_end \"$event\" from break_video"; $event_end $thread );
		[ -f $state_file ] && . $state_file;
		[[ ( -x $event_start ) && ( "$state" -eq 1 ) && ( -n "$(pgrep -f "^motion +-c")" ) ]] && ( logmsg "event_start \"$event\" from break_video"; $event_start $thread );
		rm -f $state_file;
	    fi;
	done;
	sleep $interval;
    done;
}

for pid in $(pgrep -f "^\/.*\/$SELF_NAME" | sed "/$$/d"); do
    [[ -d /proc/$pid ]] && prevpid="$prevpid $pid"
done;

case "$1" in
    "start" | "restart" | "")
        if [[ $prevpid ]]; then
            logmsg "$SELF_NAME already running"
            logmsg "$SELF_NAME stopping...";
            kill -9 $prevpid
        fi
        logmsg "$SELF_NAME starting...";
        break_video &
        ;;
    "stop")
        if [[ $prevpid ]]; then
            logmsg "$SELF_NAME stopping...";
            kill -9 $prevpid
        else
            logmsg "$SELF_NAME not running...";
        fi
        ;;
    *)
        echo "uses $(basename $0) [start|stop|restart]";
        ;;
esac

