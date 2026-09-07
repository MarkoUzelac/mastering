import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

// Build the browser bundle without the development/server entrypoint first.
run('npx', ['vite', 'build']);

// Netlify functions are compiled separately by Netlify's functions build system.
// Avoid generating the legacy bundled Express server into the public publish tree.
