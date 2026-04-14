#!/bin/bash
# School Manager - Reliable Start Script
# Handles port conflicts and ensures clean startup

echo "School Manager - Starting..."

# Kill any existing server on port 3000
fuser -k 3000/tcp 2>/dev/null
sleep 2

cd /home/z/my-project

# Copy static assets (needed after rebuild)
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null

# Start server with crash handling
node -e "
process.on('uncaughtException', (err) => { console.error('UNCAUGHT:', err.message, err.stack); });
process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err); });
require('./.next/standalone/server.js');
" > /tmp/schoolmanager.log 2>&1 &

echo "Server starting on port 3000..."
sleep 4

if ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ School Manager is running on http://localhost:3000"
else
    echo "❌ Failed to start. Check /tmp/schoolmanager.log"
    cat /tmp/schoolmanager.log
    exit 1
fi
