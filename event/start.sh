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
export ramdisk_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs ramdisk_dir)
export images_dbase_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs images_dbase_dir)
[[ -z $format ]] && export format='mp4'


event_date=`date +%Y%m%d`
movie_file=`date +%H%M%S`
snap_file=$ramdisk_dir/$event/$event_date$movie_file.jpg
dbase_dir=$images_dbase_dir/$event_date/$event
movie_dir=$dbase_dir/movie
snap_dir=$dbase_dir/snap
pid_file=$ramdisk_dir/events/$thread




if [ -s $pid_file ]; then
    pid=$(get_ini_param $pid_file pid)
    logmsg "starting: check $pid_file with pid=$pid"
    trys=0;
    while [[ ( -n "$pid" ) && ( -d "/proc/$pid" ) ]]; do
        if [[ $trys -gt 10 ]]; then
    	    logmsg "starting: exists $pid_file with pid=$pid";
    	    exit;
    	fi;
        [[ -d "/proc/$pid" ]] && sleep 0.5;
        trys=$(( $trys+1 ));
    done;
fi

if [[ -n $url ]]; then
mkdir -p $movie_dir


if [[ -f $snap_file ]]; then
    mkdir -p $snap_dir;
    cp -f $snap_file $snap_dir/$movie_file.jpg
    echo "$"$movie_file"#18" >> $dbase_dir/snap_journal
fi;

t1=$(date +%s.%N)
pid=`$kmotion_dir/event/rtsp2$format $url $movie_dir/$movie_file.$format`

if [[ ( -n "$pid" ) && ( -d "/proc/$pid" ) ]]; then
    if [ -s $pid_file ]; then
	npid=$(get_ini_param $pid_file pid)
	nmovie_file=$(get_ini_param $pid_file movie)
	if [[ ( -n "$npid" ) && ( -d "/proc/$npid" ) ]]; then
	    trys=0;
	    while [[ -d "/proc/$pid" ]]; do
		[[ $trys -lt 10 ]] && kill -15 $pid || kill -9 $pid;
	        [[ -d "/proc/$pid" ]] && sleep 0.5;
	        trys=$(( $trys+1 ));
	    done;
	    [[ "$nmovie_file" != "$movie_file" ]] && rm -f $movie_dir/$movie_file.$format;
    	    exit;
	fi
    fi
    logmsg "start grabbing to $movie_dir/$movie_file.$format with pid=$pid"
    echo -e "pid=$pid\nmovie=$movie_file\ndate=$event_date" > $pid_file
else
    rm -f $movie_dir/$movie_file.$format;
fi;
fi;
