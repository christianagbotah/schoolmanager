#!/bin/bash
# Persistent watchdog - keeps production server alive
LOG="/home/z/my-project/dev.log"
STANDALONE="/home/z/my-project/.next/standalone/server.js"

while true; do
    # Check if server is responding
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:3000/login 2>/dev/null)
    
    if [ "$STATUS" != "200" ]; then
        # Kill any lingering process
        fuser -k 3000/tcp 2>/dev/null
        sleep 1
        
        # Start fresh
        echo "[$(date)] Watchdog: Restarting server (was $STATUS)" >> "$LOG"
        cd /home/z/my-project/.next/standalone
        NODE_ENV=production NODE_OPTIONS='--max-old-space-size=256' nohup node server.js >> "$LOG" 2>&1 &
        
        # Wait for it to be ready
        for i in $(seq 1 30); do
            sleep 1
            CHECK=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:3000/login 2>/dev/null)
            if [ "$CHECK" = "200" ]; then
                echo "[$(date)] Watchdog: Server ready (PID $!)" >> "$LOG"
                break
            fi
        done
    fi
    
    # Check every 30 seconds
    sleep 30
done
