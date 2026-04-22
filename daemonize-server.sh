#!/bin/bash
# Daemonize the Next.js server
cd /home/z/my-project/.next/standalone

# Double-fork to fully daemonize
(
  trap '' HUP INT TERM
  NODE_ENV=production NODE_OPTIONS='--max-old-space-size=256' node server.js </dev/null >/home/z/my-project/dev.log 2>&1 &
  echo $! > /home/z/my-project/server.pid
  disown
  exit 0
) &
DISOWNER_PID=$!
wait $DISOWNER_PID 2>/dev/null
echo "Daemon launched"
sleep 3
if [ -f /home/z/my-project/server.pid ]; then
  PID=$(cat /home/z/my-project/server.pid)
  if kill -0 $PID 2>/dev/null; then
    echo "Server running as PID $PID"
  else
    echo "Server failed to start"
  fi
fi
