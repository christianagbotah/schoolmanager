#!/bin/bash
# School Manager - Production Server Startup Script
# Uses setsid for full terminal detachment
cd /home/z/my-project/.next/standalone
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=256"
exec node server.js
