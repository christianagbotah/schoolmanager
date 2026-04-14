#!/bin/bash
# School Manager - Start Script
# Kills any existing process and starts fresh

echo "Killing any existing server..."
fuser -k 3000/tcp 2>/dev/null
sleep 2

echo "Starting School Manager server..."
cd /home/z/my-project
nohup env NODE_ENV=production node .next/standalone/server.js > /tmp/schoolmanager.log 2>&1 &
echo "Server started with PID $!"

# Wait and verify
sleep 3
if ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server failed to start"
    cat /tmp/schoolmanager.log
fi
