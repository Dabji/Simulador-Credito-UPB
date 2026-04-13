import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/Core/$1',
    '^@application/(.*)$': '<rootDir>/src/Application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/Infrastructure/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/index.ts',
    '!src/Infrastructure/**',
    '!src/seeds/**',
  ],
};

export default config;
