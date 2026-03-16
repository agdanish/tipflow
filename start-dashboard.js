const { spawn } = require('child_process');
const { resolve } = require('path');

const dashboardDir = resolve(__dirname, 'dashboard');
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173'], {
  cwd: dashboardDir,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('Failed to start dashboard:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
