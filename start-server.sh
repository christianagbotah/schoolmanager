#!/bin/bash
# School Manager - Production Server Startup Script
cd /home/z/my-project/.next/standalone
exec NODE_ENV=production NODE_OPTIONS='--max-old-space-size=256' node server.js
