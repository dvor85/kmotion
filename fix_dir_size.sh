#!/bin/bash
for d in /mnt/kmotion/images_dbase/*; do 
    echo `du -sb "/mnt/kmotion/images_dbase/$d" | awk '{print $1}'` > "/mnt/kmotion/images_dbase/$d/dir_size"; 
done;