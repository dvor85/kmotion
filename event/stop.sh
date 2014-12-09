#!/bin/bash

function logmsg
{
    [[ -n "$1" ]] && logger -t "kmotion" -i -p user.info "$1";
}

SELF_NAME=$(basename $0)
[[ $(id -u) -eq 0 ]] && logmsg "$SELF_NAME cant be run as root" && exit 0
for pid in $(pgrep -f "^\/.*\/$SELF_NAME $@$" | sed "/$$/d"); do
    [[ -d /proc/$pid ]] && prevpid="$prevpid $pid"
done;
[[ $prevpid ]] && logmsg "$SELF_NAME $@ already running" && exit 0
    

[[ -n "$1" ]] && export thread=$1 || exit;
export event=$(printf %02.0f $thread);
export kmotion_dir=`readlink -f "$(dirname $0)/../"`

feed_file=$kmotion_dir/event/$event.sh;
[[ -s $feed_file ]] && . $feed_file || exit;

. $kmotion_dir/core/ini;
export images_dbase_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs images_dbase_dir)
export ramdisk_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs ramdisk_dir)
[[ -z $format ]] && export format='mp4'



pid_file=$ramdisk_dir/events/$thread
[ ! -s $pid_file ] && exit;
pid=$(get_ini_param $pid_file pid);


if [[ -n "$pid" ]]; then
    trys=0;
    while [[ -d "/proc/$pid" ]]; do
	[[ $trys -lt 10 ]] && kill -15 $pid || kill -9 $pid;
	logmsg "killing: $pid_file with pid=$pid";
	[[ -d "/proc/$pid" ]] && sleep 0.5;
	trys=$(( $trys+1 ));
    done;
    
    movie_file=$(get_ini_param $pid_file movie);
    event_date=$(get_ini_param $pid_file date);
    cur_date=`date +%Y%m%d`;
    event_end_time=`date +%H%M%S`;
    if [[ $cur_date != $event_date ]]; then
	hour=$(( `date +%H` + 24 ))
	event_end_time="$hour"`date +%M%S`
    fi;

    movie_dir=$images_dbase_dir/$event_date/$event/movie
    movie_journal=$images_dbase_dir/$event_date/$event/movie_journal
    
    [[ -s "$movie_dir/$movie_file.$format" ]] && echo "$"$event_end_time >> $movie_journal || rm -f $movie_dir/$movie_file.$format
    
    npid=$(get_ini_param $pid_file pid)
    if [[ $pid -eq $npid ]]; then
	rm -f $pid_file;
	logmsg "deleting: $pid_file with pid=$pid";
    fi;
else
    rm -f $pid_file;
fi


