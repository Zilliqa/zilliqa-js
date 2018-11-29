const { matchersWithOptions } = require('jest-json-schema');
expect.extend(matchersWithOptions({ allErrors: true }));
