'use strict';

const path = require('path');

let INTERNAL_ADDON_TEST_FIXTURES = [];

/**
 * Whether we're in the test environment, determined by the
 * `PACKAGE_UTILS_TESTING` environment variable
 *
 * @returns {Boolean}
 */
function isTesting() {
  return !!process.env.PACKAGE_UTILS_TESTING;
}

/**
 * Sets up the test environment; ie, sets the `PACKAGE_UTILS_TESTING`
 * environment variable to `true`. This controls some things when running
 * the script and utils; namely, whether we memoize expensive calculations
 * to improve performance.
 *
 */
function setupTestEnvironment() {
  process.env.PACKAGE_UTILS_TESTING = true;
}

/**
 * Registers internal addons; specifically used for custom fixtures
 * to test "fake" addons
 *
 * @param {Array} testFixtures
 * @returns {Array}
 */
function registerInternalAddonTestFixtures(testFixtures = []) {
  const internalAddonFixtureSet = new Set(INTERNAL_ADDON_TEST_FIXTURES);

  INTERNAL_ADDON_TEST_FIXTURES.push(
    ...testFixtures
      .map((pathToFixture) => {
        if (pathToFixture.endsWith(path.join(path.sep, 'package.json'))) {
          return path.dirname(pathToFixture);
        }

        return pathToFixture;
      })
      .filter((testFixture) => !internalAddonFixtureSet.has(testFixture))
  );
}

/**
 * Resets all internal addon test fixtures
 */
function resetInternalAddonTestFixtures() {
  INTERNAL_ADDON_TEST_FIXTURES = [];
}

/**
 * Gets all internal addon test fixtures
 *
 * @returns {string[]} All absolute paths representing addon test fixtures on disk
 */
function getInternalAddonTestFixtures() {
  return INTERNAL_ADDON_TEST_FIXTURES;
}

module.exports = {
  isTesting,
  resetInternalAddonTestFixtures,
  registerInternalAddonTestFixtures,
  setupTestEnvironment,
  getInternalAddonTestFixtures,
};
