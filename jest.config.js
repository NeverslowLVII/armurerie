const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/src/__tests__/setup.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@radix-ui/(.*)$': '<rootDir>/node_modules/@radix-ui/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^lucide-react$': '<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@radix-ui|lucide-react|@heroicons|framer-motion|class-variance-authority|tailwind-merge|clsx|@headlessui)/)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/api/**',
    '!src/test/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/components/ui/**', // Excluding UI library components
    '!src/lib/prisma.ts',    // Database configuration
    '!src/lib/utils.ts',     // Utility functions
    '!src/app/layout.tsx',   // Next.js layout
    '!src/app/page.tsx',     // Next.js pages
    '!src/app/providers.tsx' // App providers
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 