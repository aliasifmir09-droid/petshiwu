#!/bin/bash
cd /workspace/petshiwu/scripts
nohup python3 -u fix_descriptions.py >> /workspace/petshiwu/fix_desc_log.txt 2>&1 &
echo "PID: $!"
