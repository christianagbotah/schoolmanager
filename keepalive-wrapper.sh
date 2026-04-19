#!/bin/bash
# Robust keepalive - waits between restarts
cd /home/z/my-project/.next/standalone
while true; do
  # Check if port is free before starting
  if ss -tlnp | grep -q ':3000 '; then
    sleep 5
    continue
  fi
  NODE_ENV=production NODE_OPTIONS="--max-old-space-size=256" node server.js 2>&1
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE at $(date)"
  sleep 5
done
