#!/bin/bash

# """
# Creates the appropreate file in 'ramdisk_dir/events' and execute the
# appropreate script in 'event' if it exists.
# """


function logmsg
{
    [[ -n "$1" ]] && logger -t "kmotion" -i -p user.info "$1";
}

function main
{
    # """
    # Creates the appropreate file in 'ramdisk_dir/events' and execute the
    # appropreate script in 'event' if it exists.
    # """

    thread=$(printf %01.0f $1)
    event=$(printf %02.0f $1)
	
    kmotion_dir=`readlink -f "$(dirname $0)/../"`
    . $kmotion_dir/core/ini;
    
    ramdisk_dir=$(get_ini_section_param $kmotion_dir/kmotion_rc dirs ramdisk_dir);
    
    
    event_file="$ramdisk_dir/events/$thread";
    state_file="$ramdisk_dir/states/$event";
    exe_file="$kmotion_dir/event/start.sh"
    
    if [[ -f $state_file ]]; then
	echo "state=1" > $state_file;
	exit 0;
    fi;
                
    if [[ ! -f $event_file ]]; then
	logmsg "creating: $event_file";
	touch $event_file;
    fi;
    
    
    if [[ -x $exe_file ]]; then
        logmsg "executing: $exe_file $@";
        nice -n 20 $exe_file $thread & &> /dev/null
    fi;
}

SELF_NAME=$(basename $0)
[[ $(id -u) -eq 0 ]] && logmsg "$SELF_NAME cant be run as root" && exit 0
for pid in $(pgrep -f "^\/.*\/$SELF_NAME $@$" | sed "/$$/d"); do
    [[ -d /proc/$pid ]] && prevpid="$prevpid $pid"
done;
[[ $prevpid ]] && logmsg "$SELF_NAME $@ already running" && exit 0

main $1

