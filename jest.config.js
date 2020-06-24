//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
const config = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['<rootDir>/packages/**/test/?(*.)+(spec|test).ts'],
  moduleDirectories: [
    'packages/*/src',
    '<rootDir>/includes',
    '<rootDir>/node_modules',
    '<rootDir>/*/node_modules',
  ],
  moduleFileExtensions: ['js', 'ts', 'node', 'json'],
  moduleNameMapper: {
    '^@zilliqa-js/zilliqa': '<rootDir>/packages/zilliqa/src/index.ts',
    '^@zilliqa-js/proto$': '<rootDir>/packages/zilliqa-js-proto/dist/index.js',
    '^@zilliqa-js/(.*)$': '<rootDir>/packages/zilliqa-js-$1/src/index.ts',
    'cross-fetch': 'jest-fetch-mock',
  },
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsConfig: './tsconfig.test.json',
    },
  },
  testURL: 'http://localhost',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/packages/*/src/**/*.{ts,js}',
    '!**/node_modules/**',
  ],
  setupFiles: ['<rootDir>/jest-setup.js'],
  setupTestFrameworkScriptFile: '<rootDir>/jest-framework-setup.js',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  modulePathIgnorePatterns: ['packages/zilliqa-js-viewblock'],
};

module.exports = config;
