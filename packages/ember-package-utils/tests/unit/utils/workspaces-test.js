'use strict';

const QUnit = require('qunit');
const tmp = require('tmp');
const fixturify = require('fixturify');
const path = require('path');
const walkSync = require('walk-sync');

const {
  registerInternalAddonTestFixtures,
  setupTestEnvironment,
  resetInternalAddonTestFixtures,
} = require('../../../utils/test-environment');

const {
  getWorkspaceGlobs,
  isWorkspace,
} = require('../../../-private/utils/workspace');

const {
  PACKAGE_FIXTURE_NAMES,
  PACKAGE_FIXTURES,
} = require('../../fixtures/package-fixtures');

const { module: qunitModule, test } = QUnit;

tmp.setGracefulCleanup();

qunitModule('Unit | workspaces', function (hooks) {
  function setupAddonFixtures(tmpLocation) {
    fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
  }

  hooks.beforeEach(function () {
    setupTestEnvironment();
    const { name: tmpLocation } = tmp.dirSync();
    this.tmpLocation = tmpLocation;
    setupAddonFixtures(this.tmpLocation);

    registerInternalAddonTestFixtures(
      walkSync(this.tmpLocation, {
        globs: ['**/*/package.json'],
        ignore: ['node_modules'],
        includeBasePath: true,
      })
    );
  });

  hooks.afterEach(() => {
    resetInternalAddonTestFixtures();
  });

  test('getWorkspaceGlobs', function (assert) {
    assert.ok(
      getWorkspaceGlobs(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.WORKSPACE_CONTAINER
        )
      ).filter((glob) => glob.includes('packages/*'))
    );
  });

  test('isWorkspace', function (assert) {
    assert.false(
      isWorkspace(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.WORKSPACE_CONTAINER
        ),
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.NON_WORKSPACE_IN_WORKSPACE_CONTAINER
        )
      ),
      `${PACKAGE_FIXTURE_NAMES.NON_WORKSPACE_IN_WORKSPACE_CONTAINER} is NOT a workspace`
    );

    assert.true(
      isWorkspace(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.WORKSPACE_CONTAINER
        ),
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.WORKSPACE_CONTAINER,
          'packages',
          PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON_IN_WORSKAPCE_CONTAINER
        )
      ),
      `${PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON_IN_WORSKAPCE_CONTAINER} is NOT a workspace`
    );
  });
});
