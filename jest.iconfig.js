const baseConfig = require('./jest.config');
module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    '^@zilliqa-js/zilliqa': '<rootDir>/packages/zilliqa/src/index.ts',
    '^@zilliqa-js/proto$': '<rootDir>/packages/zilliqa-js-proto/dist/index.js',
    '^@zilliqa-js/(.*)$': '<rootDir>/packages/zilliqa-js-$1/src/index.ts',
  },
  setupTestFrameworkScriptFile: '<rootDir>/jest-framework-setup.js',
  testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
};
