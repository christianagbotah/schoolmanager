const { spawn } = require('child_process');
const path = '/home/z/my-project/.next/standalone/server.js';

function start() {
  console.log(`[${new Date().toISOString()}] Starting server...`);
  const child = spawn(process.execPath, [path], {
    cwd: '/home/z/my-project/.next/standalone',
    env: { ...process.env, NODE_ENV: 'production', NODE_OPTIONS: '--max-old-space-size=256' },
    stdio: ['inherit', 'inherit', 'inherit'],
    detached: false
  });
  
  child.on('exit', (code, signal) => {
    console.log(`[${new Date().toISOString()}] Server exited (code=${code}, signal=${signal}). Restarting in 3s...`);
    setTimeout(start, 3000);
  });
  
  child.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}. Restarting in 3s...`);
    setTimeout(start, 3000);
  });
}

start();
