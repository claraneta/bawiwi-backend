const readline = require('readline');
const { spawnSync } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter migration name: ', (name) => {
  rl.close();

  if (!name || !name.trim()) {
    console.error('Error: Migration name is required.');
    console.error('Usage: npm run migration:generate');
    process.exit(1);
  }

  const migrationName = name.trim();
  console.log(`Generating migration: ${migrationName}`);

  const result = spawnSync(
    'npx',
    [
      'typeorm-ts-node-commonjs',
      'migration:generate',
      path.join('src', 'db', 'migrations', migrationName),
      '-d',
      path.join('.', 'src', 'db', 'data-source.ts'),
    ],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    },
  );

  process.exit(result.status ?? 1);
});
