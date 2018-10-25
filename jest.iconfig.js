const baseConfig = require('./jest.config');
module.exports = {
  ...baseConfig,
  setupTestFrameworkScriptFile: './jest-framework-setup.js',
  testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
};
