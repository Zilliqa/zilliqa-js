const config = {
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testMatch: [
    // '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/?(*.)+(spec|test).ts',
  ],
  moduleDirectories: ['src', 'node_modules'],
  moduleFileExtensions: ['js', 'ts'],
  globals: {
    'ts-jest': { useBabelrc: true },
  },
  testURL: 'http://localhost',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['<rootDir>/jest-setup.js'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}

module.exports = config;
