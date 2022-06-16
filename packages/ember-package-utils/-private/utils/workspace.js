'use strict';

const path = require('path');
const micromatch = require('micromatch');
const { readPackageJsonSync } = require('./package-json');

/**
 * Gets all workspace globs from the `mpRoot`'s `package.json`
 *
 * @name getWorkspaceGlobs
 * @param {string} pathToRoot The absolute path to root of the repo
 * @returns {string[]} An array of globs
 */
function getWorkspaceGlobs(pathToRoot) {
  const packageJson = readPackageJsonSync(pathToRoot);
  return (packageJson.workspaces || []).map((glob) =>
    path.join(pathToRoot, glob)
  );
}

/**
 * Given an MP root, returns whether the path to the provided `package.json`
 * is a workspace
 *
 * @name isWorkspace
 * @param {string} pathToRoot The absolute path to root of the repo
 * @param {string} pathToPackage The path to the package
 * @returns {boolean} Whether or not `pathToPackageJson` represents a workspace
 */
function isWorkspace(pathToRoot, pathToPackage) {
  return micromatch.isMatch(pathToPackage, getWorkspaceGlobs(pathToRoot));
}

module.exports = {
  getWorkspaceGlobs,
  isWorkspace,
};
