/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest', // If you also have JavaScript files
  },

  transformIgnorePatterns: ["/node_modules/"],
  testEnvironment: "node",
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

export default config;

