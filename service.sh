#!/bin/bash

SELF_DIR=`readlink -f "$(dirname $0)"`;
INI_FILE="$SELF_DIR/kmotion_rc"
. $SELF_DIR/core/ini


rootdir=$(get_ini_section_param $INI_FILE dirs images_dbase_dir)
echo "rootdir = $rootdir"
rootdir_limit_gb=$(get_ini_section_param $INI_FILE storage images_dbase_limit_gb)
must_free_days=2
rootdir_size=`nice -n 19 du -sb $rootdir | sed -r 's/^([0-9]+)[[:space:]]+.*$/\1/'`
echo "dir_size = $rootdir_size"
count_days=`ls $rootdir | wc -l`
echo "count_days = $count_days"
if [ ! $count_days -eq 0 ]; then
    avg_day_size=$(($rootdir_size/$count_days))
    echo "avg_day_size = $avg_day_size"
    if [ ! $avg_day_size -eq 0 ]; then
        diff_value=$((( $rootdir_limit_gb*1024*1024*1024-$rootdir_size )/$avg_day_size ))
        echo "diff_value = $diff_value"
        if [ $diff_value -lt $must_free_days ]; then
	    del_days=$(( $must_free_days-$diff_value ))
	    #dirlist=`find $rootdir -maxdepth 1 -mindepth 1 | sort -r | head -$del_days`
	    for f in $(ls -rt $rootdir | head -$del_days); do
		rm -rf $rootdir/$f;
		#echo $rootdir$f
		logger -t "kmotion" -i -p user.info "kmotion: deleteing $f"
	    done;
	fi
    fi
fi
