import { execSync } from 'node:child_process';
import process from 'node:process';

const commands = [
  {
    name: 'Type Check',
    command: 'npm run check-types',
  },
  {
    name: 'Lint',
    command: 'npm run lint',
  },
  {
    name: 'Tests',
    command: 'npm run test:ci',
  },
  {
    name: 'Knip (Unused exports/files/deps)',
    command: 'npm run knip',
    skipArg: '--skip-knip',
  },
];

const skipKnip = process.argv.includes('--skip-knip');

console.info('🚀 Starting pre-deployment checks...');

for (const { name, command, skipArg } of commands) {
  if (skipArg && skipArg === '--skip-knip' && skipKnip) {
    console.info(`🟡 Skipping ${name} due to --skip-knip flag.`);
    continue;
  }

  console.info(`\n🔍 Running ${name} (${command})...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.info(`✅ ${name} passed.`);
  } catch (error) {
    console.error(
      `\n❌ ${name} failed. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    console.error('Check the output above for more details.');
    throw new Error(`${name} failed.`);
  }
}

console.info('\n✨ All pre-deployment checks passed!');
