#!/bin/bash
# Auto-restarting development server for SchoolManager
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting production server..."
  if [ -f .next/standalone/server.js ]; then
    cd .next/standalone
    NODE_ENV=production NODE_OPTIONS='--max-old-space-size=256' node server.js
  else
    echo "Standalone build missing, building..."
    cd /home/z/my-project
    NODE_OPTIONS='--max-old-space-size=1024' npx next build
  fi
  echo "[$(date)] Server exited with code $?. Restarting in 5s..."
  sleep 5
done
