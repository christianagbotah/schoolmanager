#!/bin/bash
cd /home/z/my-project/.next/standalone
exec NODE_ENV=production NODE_OPTIONS="--max-old-space-size=256" node server.js > /home/z/my-project/dev.log 2>&1
