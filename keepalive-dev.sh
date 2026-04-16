#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev >> /home/z/my-project/dev.log 2>&1 &
  SRV_PID=$!
  # Keep pinging the server to keep it warm and prevent sandbox from killing it
  for i in $(seq 1 180); do
    sleep 5
    if ! kill -0 $SRV_PID 2>/dev/null; then
      break
    fi
    curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3000/login > /dev/null 2>&1
  done
  kill $SRV_PID 2>/dev/null
  sleep 2
done
