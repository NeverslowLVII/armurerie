import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "vitest.setup.ts",
		include: [
			"src/**/*.{test,spec}.{ts,tsx}",
			"__tests__/**/*.{test,spec}.{ts,tsx}",
		],
		pool: "forks",
		poolOptions: {
			forks: {
				isolate: false,
			},
		},
		reporters: ["default", "html"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov", "text-summary"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules/**",
				".next/**",
				"dist/**",
				"html/**",
				"**/*.d.ts",
				"**/*.test.{ts,tsx}",
				"**/__tests__/**",
				"**/test/**",
				".turbo/**",
				"public/**",
				"**/*.config.{js,ts}",
				"next.config.js",
				"vitest.{config,setup}.ts",
				"scripts/**",
				"coverage/**",
				"**/*.types.ts",
				"**/types.ts",
				"**/*.mock.ts",
				"**/*.stories.{ts,tsx}",
				"src/pages/api/discord/webhook/complete.ts",
				"src/components/ui/**",
			],
			include: ["src/**/*.{ts,tsx}"],
			skipFull: true,
			thresholds: {
				statements: 0,
				branches: 0,
				functions: 0,
				lines: 0,
			},
			all: true,
		},
		testTimeout: 10_000,
	},
	plugins: [react()],
	resolve: {
		alias: {
			"@": `${__dirname}/src`,
		},
	},
});
