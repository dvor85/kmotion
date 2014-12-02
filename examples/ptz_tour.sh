#!/bin/bash

while [ true ]; do
    echo 'Preset 1'
    kmotion_ptz 1 1
    sleep 10
    echo 'Preset 2'
    kmotion_ptz 1 2
    sleep 10
    echo 'Preset 3'
    kmotion_ptz 1 3
    sleep 10
    echo 'Preset 4'
    kmotion_ptz 1 4
    sleep 10
done

