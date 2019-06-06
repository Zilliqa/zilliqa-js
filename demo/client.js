#!/usr/bin/env node

const { BncThreshSigServer } = require('../dist/src/server');
new BncThreshSigServer().launch();
