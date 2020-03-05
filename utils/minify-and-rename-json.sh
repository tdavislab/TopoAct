#!/bin/bash

# Copy and execute the command below in the top-level directory that contains the layer folders
for d in */; do (
  cd "$d"
  jq -c . <output.json >output.json.min
  rm output.json
  mv output.json.min output.json
); done

# Compress directory
tar -czf folder.tar.gz folder

# Extract directory
tar -xzf folder.tar.gz

# Copy a file from activation-atlas folder to current folder
scp archit@155.98.19.211:/usr/sci/projects/activation-atlas/folder.tar.gz ./
