#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js server..."
  npx next dev --port 3000 2>&1
  echo "[$(date)] Server crashed, restarting in 3s..."
  sleep 3
done
