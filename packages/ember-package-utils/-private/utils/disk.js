'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');

/**
 * Reads a file at a given path and return the contents.
 * @param {string} _path - the path to the file to read
 * @returns {string}
 */
function readFileSync(_path) {
  return fs.readFileSync(_path, 'utf-8');
}

function writeFile(path, data) {
  return fsPromises.writeFile(path, data, {
    encoding: 'utf8',
  });
}

module.exports = {
  readFileSync,
  writeFile,
};
