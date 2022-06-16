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
  isAddon,
  isEngine,
  getEmberAddonName,
  getPackageMainFileName,
  requirePackageMain,
  getPackageMainAST,
  writePackageMain,
} = require('../../../-private/utils/ember');

const {
  PACKAGE_FIXTURE_NAMES,
  PACKAGE_FIXTURES,
} = require('../../fixtures/package-fixtures');

const { module: qunitModule, test } = QUnit;

tmp.setGracefulCleanup();

function setupAddonFixtures(tmpLocation) {
  fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
}

qunitModule('Unit | ember', function (hooks) {
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

  qunitModule('simple properties', function () {
    test('isAddon', function (assert) {
      assert.true(
        isAddon(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        )
      );
      assert.true(
        isAddon(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
        )
      );
      assert.false(
        isAddon(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.PLAIN_PACKAGE)
        )
      );
    });

    test('isEngine', function (assert) {
      assert.false(
        isEngine(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ),
        'foo is NOT an engine'
      );
      assert.true(
        isEngine(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
        ),
        'bar is an engine'
      );
      assert.false(
        isEngine(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.PLAIN_PACKAGE)
        ),
        'baz is NOT an engine'
      );
    });

    test('getPackageMainFileName', function (assert) {
      // return the file name for the packageMain
      assert.equal(
        getPackageMainFileName(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
          )
        ),
        'ember-addon-main.js'
      );
    });

    test('requirePackageMain', function (assert) {
      assert.ok(
        requirePackageMain(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN
          )
        ).fileName.includes('ember-addon-main.js'),
        'the custom main js file was loaded instead of index'
      );
    });

    test('getPackageAST', function (assert) {
      // assert the ast of the correct file was read in
      assert.equal(
        getPackageMainAST(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
          )
        ).loc.filename,
        'ember-addon-main.js'
      );

      assert.equal(
        getPackageMainAST(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ).loc.filename,
        'index.js'
      );
    });
  });

  qunitModule('getEmberAddonName', function () {
    test('getEmberAddonName - simple', function (assert) {
      assert.equal(
        getEmberAddonName(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
        ),
        PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE
      );
      assert.equal(
        getEmberAddonName(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME
          )
        ),
        `${PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME}-SPECIFIED-IN-MODULENAME`
      );
    });

    test('getEmberAddonName - complex', function (assert) {
      assert.equal(
        getEmberAddonName(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
          )
        ),
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
      );
    });
  });

  qunitModule('update and write package data', function () {
    test('writePackageAST', async function (assert) {
      const pathToPackage = path.resolve(
        this.tmpLocation,
        PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON
      );
      await writePackageMain(pathToPackage, getPackageMainAST(pathToPackage));
      assert.ok(true);
    });
  });
});
