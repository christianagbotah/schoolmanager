#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting production server..."
  PORT=3000 node .next/standalone/server.js 2>&1
  echo "[$(date)] Server crashed, restarting in 2s..."
  sleep 2
done
