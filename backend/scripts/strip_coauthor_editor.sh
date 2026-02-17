#!/bin/sh
# Keep only the first line of the commit message (strip Co-authored-by)
msg_file="$1"
head -1 "$msg_file" > "${msg_file}.tmp"
mv "${msg_file}.tmp" "$msg_file"
