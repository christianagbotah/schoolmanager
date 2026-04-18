#!/bin/bash
cd /home/z/my-project/.next/standalone
while true; do
  echo "$(date) - Starting server..."
  NODE_ENV=production NODE_OPTIONS='--max-old-space-size=256' node server.js >> /home/z/my-project/dev.log 2>&1
  echo "$(date) - Server exited with code $?. Restarting in 3s..."
  sleep 3
done
