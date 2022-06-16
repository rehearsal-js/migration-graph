#!/usr/bin/env node

const { default: cli } = require('../dist/src/index.js');

(async () => {
  await cli();
})();
