#!/usr/bin/env node

const { default: cli } = require('../dist/index.js');

(async () => {
  await cli();
})();
