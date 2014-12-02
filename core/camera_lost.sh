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

[[ $1 ]] && thread=$1 || exit;
logmsg "CAMERA $thread LOST"

kmotion_dir=`readlink -f "$(dirname $0)/../"`

camera_lost="$kmotion_dir/event/lost.sh";
[[ -x $camera_lost ]] && $camera_lost $thread &

