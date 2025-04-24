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

console.log('🚀 Starting pre-deployment checks...');

for (const { name, command, skipArg } of commands) {
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	if (skipArg && skipArg === '--skip-knip' && skipKnip) {
		console.log(`🟡 Skipping ${name} due to --skip-knip flag.`);
		continue;
	}

	console.log(`
🔍 Running ${name} (${command})...`);
	try {
		execSync(command, { stdio: 'inherit' });
		console.log(`✅ ${name} passed.`);
	} catch (error) {
		console.error(`
❌ ${name} failed. Error: ${error instanceof Error ? error.message : String(error)}`);
		console.error('Check the output above for more details.');
		// biome-ignore lint/nursery/noProcessExit: Exiting is necessary in a CLI check script
		process.exit(1);
	}
}

console.log('\n✨ All pre-deployment checks passed!'); 