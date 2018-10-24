const baseConfig = require('./jest.config');
module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/packages/**/test/*.ispec.ts'],
};
