#!/bin/bash
src=$1
kmotion_dir=`readlink -f "$(dirname $0)/../"`
if [[ ( -f $src ) && ( -z $(echo $src | sed -n "/snap/p") ) ]]; then
	dst_dir="$(dirname $src)/www";
	dst_name=$(basename $src);
	[[ ! -d $dst_dir ]] && mkdir $dst_dir;
	dst="$dst_dir/$dst_name";
	dst_link="$dst_dir/last";	
	
	nice -n 20 $kmotion_dir/core/image_resize.php $src $dst "0x480" 80
	[[ -f $dst ]] && echo $dst > $dst_link || echo $src > $dst_link   
fi