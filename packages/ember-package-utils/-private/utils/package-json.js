'use strict';

const path = require('path');
const sortPackageJson = require('sort-package-json');
const { readFileSync, writeFile } = require('./disk');
const { runPrettier } = require('./run-prettier');

/**
 * Require the package.json file for a given path.
 * This expects just the directory path and appends the package.json file.
 *
 * @param {string} pathToPackage - the path to the addon directory
 * @returns {object} - the `require`d file (ie. a JSON object)
 */
function readPackageJsonSync(pathToPackage) {
  const packageJsonPath = path.resolve(pathToPackage, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath));
}

function writePackageJson(pathToPackage, data) {
  const sorted = sortPackageJson(data);

  if ('ember-addon' in sorted) {
    sorted['ember-addon'] = sortPackageJson(sorted['ember-addon']);

    // sort `ember-addon.paths`
    if (Array.isArray(sorted['ember-addon'].paths)) {
      sorted['ember-addon'].paths = sorted['ember-addon'].paths.sort();
    }
  }

  return writeFile(
    path.join(pathToPackage, 'package.json'),
    runPrettier(JSON.stringify(sorted, null, 2), 'package.json')
  );
}

module.exports = {
  readPackageJsonSync,
  writePackageJson,
};
