#!/bin/bash
cd /home/z/my-project
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null

while true; do
  PORT=3001 node -e "
    process.on('uncaughtException', () => {});
    process.on('unhandledRejection', () => {});
    require('./.next/standalone/server.js');
  " > /home/z/my-project/dev.log 2>&1
  sleep 2
done
