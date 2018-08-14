// Copyright (c) 2018 Zilliqa
// This source code is being disclosed to you solely for the purpose of your participation in
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to
// the protocols and algorithms that are programmed into, and intended by, the code. You may
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd.,
// including modifying or publishing the code (or any part of it), and developing or forming
// another public or private blockchain network. This source code is provided ‘as is’ and no
// warranties are given as to title or non-infringement, merchantability or fitness for purpose
// and, to the extent permitted by law, all liability for your use of the code is disclaimed.
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
