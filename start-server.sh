#!/bin/bash
# School Manager - Production Server Startup Script with Watchdog
cd /home/z/my-project/.next/standalone
export NODE_ENV=production
while true; do
  node server.js 2>&1
  echo "$(date): Server crashed, restarting in 3s..."
  sleep 3
done
