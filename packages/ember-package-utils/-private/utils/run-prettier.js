'use strict';

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
/**
 * Runs prettier on a source string
 *
 * @name runPrettier
 * @param {String} source
 * @param {String} filePath
 */
function runPrettier(source, filePath) {
  // Attempt to find prettier config.
  const maybePrettierConfig = path.join(process.cwd(), '.prettierrc');

  let prettierConfig = '{}';

  if (fs.existsSync(maybePrettierConfig)) {
    prettierConfig = fs.readFileSync(maybePrettierConfig, 'utf8');
  } else {
    console.warn('No .prettierrc found. Using default');
  }

  const DEFAULT_PRETTIER_CONFIG = JSON.parse(prettierConfig);

  return prettier.format(source, {
    ...DEFAULT_PRETTIER_CONFIG,
    filepath: filePath,
  });
}

module.exports = { runPrettier };
