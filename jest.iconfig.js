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
const baseConfig = require('./jest.config');
module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    '^@zilliqa-js/zilliqa': '<rootDir>/packages/zilliqa/src/index.ts',
    '^@zilliqa-js/proto$': '<rootDir>/packages/zilliqa-js-proto/dist/index.js',
    '^@zilliqa-js/(.*)$': '<rootDir>/packages/zilliqa-js-$1/src/index.ts',
  },
  testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
};
