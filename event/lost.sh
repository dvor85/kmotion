#!/bin/bash

function logmsg
{
    [[ -n "$1" ]] && logger -t "kmotion" -i -p user.info "$1";
}

function getip_from_url
{
    [[ -n "$1" ]] && echo $1 | sed -r 's/.*\/\/([0-9a-Z\.\:]*).*/\1/g' 2> /dev/null
    return $?
}

function get_param
{
    [[ -n "$1" ]] && $wget --tries=5 -O - http://localhost:8080/$thread/config/list 2> /dev/null | sed  -n "/$1/p" | sed -r 's/^<.*> *= *(.*)<.*$/\1/'
    return $?
}

SELF_NAME=$(basename $0)
[[ $(id -u) -eq 0 ]] && logmsg "$SELF_NAME cant be run as root" && exit 0
for pid in $(pgrep -f "^\/.*\/$SELF_NAME $@$" | sed "/$$/d"); do
    [[ -d /proc/$pid ]] && prevpid="$prevpid $pid"
done;
[[ $prevpid ]] && logmsg "$SELF_NAME $@ already running" && exit 0
    

user=admin
password=ghjuhtcc
wget="wget -q --user=$user --password=$password --retry-connrefused --wait=60";

[[ -n "$1" ]] && thread=$1 || exit;
event=$(printf %02.0f $thread);
kmotion_dir=`readlink -f "$(dirname $0)/../"`

feed_file=$kmotion_dir/event/$event.sh;
[[ -s $feed_file ]] && . $feed_file;



sleep $((RANDOM%20))
netcam_url=$(get_param "netcam_url") || netcam_url=''

REBOOTED=0
if [[ ( -n "$ip" ) && ( -n $reboot_url ) ]]; then
    Len=0;
    t=0;
    while [[ ( $Len -eq 0 ) && ( $t -lt 5 ) ]]; do
	Len=`$wget --tries=600 $netcam_url -O - 2> /dev/null | wc -c`
	[[ $Len -eq 0 ]] && t=$(($t+1)) || break;
	sleep 1;
    done;
    if [[ $Len -eq 0 ]]; then
	$wget --tries=5 -O /dev/null $reboot_url
	REBOOTED=$?
	if [ $REBOOTED -eq 0 ]; then
	    sleep 2m;
	    logmsg "camera $ip reboot success";
	else
	    logmsg "camera $ip reboot failed";
	fi
    fi
fi

if [[ $REBOOTED -eq 0 ]]; then
    $wget --tries=5 -O /dev/null http://localhost:8080/$thread/action/restart
    if [[ $? -eq 0 ]]; then
	logmsg "restart of thread $thread success";
    else
	logmsg "restart of thread $thread failed";
    fi
fi


