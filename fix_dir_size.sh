#!/bin/bash

SELF_DIR=`readlink -f "$(dirname $0)"`;
INI_FILE="$SELF_DIR/kmotion_rc"
. $SELF_DIR/core/ini

rootdir=$(get_ini_section_param $INI_FILE dirs images_dbase_dir)
for d in $rootdir/*; do 
    echo `du -sb "$rootdir/$d" | awk '{print $1}'` > "$rootdir/$d/dir_size"; 
done;