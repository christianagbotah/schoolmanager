#!/bin/bash
while true; do
  cd /home/z/my-project/.next/standalone
  NODE_ENV=production node server.js 2>&1
  echo "Server died, restarting in 3s..."
  sleep 3
done
