'use strict';

const QUnit = require('qunit');
const tmp = require('tmp');
const fixturify = require('fixturify');
const path = require('path');
const walkSync = require('walk-sync');

const { module: qunitModule, test } = QUnit;

const {
  registerInternalAddonTestFixtures,
  setupTestEnvironment,
  resetInternalAddonTestFixtures,
} = require('../../../utils/test-environment');

const {
  PACKAGE_FIXTURE_NAMES,
  PACKAGE_FIXTURES,
} = require('../../fixtures/package-fixtures');

const {
  EmberAddonPackage,
} = require('../../../-private/entities/ember-addon-package');

tmp.setGracefulCleanup();

function setupAddonFixtures(tmpLocation) {
  fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
}

qunitModule('Unit | EmberAddonPackage', function (hooks) {
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
    test('isEngine', function (assert) {
      assert.true(
        new EmberAddonPackage(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
        ).isEngine
      );
      assert.false(
        new EmberAddonPackage(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ).isEngine,
        'foo is NOT engine'
      );
    });

    test('name', function (assert) {
      assert.equal(
        new EmberAddonPackage(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ).name,
        PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON
      );
      assert.equal(
        new EmberAddonPackage(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME
          )
        ).packageName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME,
        'fetch the name property even if module name is defined'
      );
    });

    test('moduleName', function (assert) {
      assert.equal(
        new EmberAddonPackage(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME
          )
        ).moduleName,
        `${PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME}-SPECIFIED-IN-MODULENAME`
      );
    });

    test('packageMain', function (assert) {
      assert.equal(
        new EmberAddonPackage(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ).packageMain,
        'index.js',
        'fetch the name of the main file'
      );

      assert.equal(
        new EmberAddonPackage(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN
          )
        ).packageMain,
        'ember-addon-main.js',
        'fetch the name of the main file'
      );
    });
  });

  qunitModule('package main updates', function () {
    test('setAddonName', async function (assert) {
      const simpleAddon = new EmberAddonPackage(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(simpleAddon.name, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON);
      simpleAddon.setAddonName('taco');
      assert.equal(
        simpleAddon.name,
        PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON,
        'name is unchanged until write happens'
      );
      await simpleAddon.writePackageMainToDisk();
      assert.equal(
        simpleAddon.name,
        'taco',
        'name is changed after the main is written'
      );
    });

    test('setAddonName - more complex packageMain', async function (assert) {
      const simpleAddon = new EmberAddonPackage(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.MULTIPLE_EXPORTS_FROM_ADDON_MAIN
        )
      );
      assert.equal(
        simpleAddon.name,
        PACKAGE_FIXTURE_NAMES.MULTIPLE_EXPORTS_FROM_ADDON_MAIN
      );
      simpleAddon.setAddonName('taco');
      assert.equal(
        simpleAddon.name,
        PACKAGE_FIXTURE_NAMES.MULTIPLE_EXPORTS_FROM_ADDON_MAIN,
        'name is unchanged until write happens'
      );
      await simpleAddon.writePackageMainToDisk();
      assert.equal(
        simpleAddon.name,
        'taco',
        'name is changed after the main is written'
      );
    });

    test('setModuleName - simple', async function (assert) {
      const simpleAddon = new EmberAddonPackage(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(simpleAddon.moduleName, undefined);
      simpleAddon.setModuleName('taco');
      assert.equal(
        simpleAddon.moduleName,
        undefined,
        'name is unchanged until write happens'
      );
      await simpleAddon.writePackageMainToDisk();
      assert.equal(
        simpleAddon.moduleName,
        'taco',
        'name is changed after the main is written'
      );
    });

    test('setModuleName - complex', async function (assert) {
      const complexAddon = new EmberAddonPackage(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
        )
      );
      assert.equal(
        complexAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
      );
      complexAddon.setModuleName('taco');
      assert.equal(
        complexAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN,
        'name is unchanged until write happens'
      );
      await complexAddon.writePackageMainToDisk();
      assert.equal(
        complexAddon.moduleName,
        'taco',
        'name is changed after the main is written'
      );
    });

    test('removeModuleName - simple', async function (assert) {
      const complexAddon = new EmberAddonPackage(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN
        )
      );
      assert.equal(
        complexAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN
      );
      complexAddon.removeModuleName();
      assert.equal(
        complexAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN,
        'name is unchanged until write happens'
      );
      await complexAddon.writePackageMainToDisk();
      assert.equal(
        complexAddon.moduleName,
        undefined,
        'name is changed after the main is written'
      );
    });

    test('removeModuleName - conplex', async function (assert) {
      const simpleAddon = new EmberAddonPackage(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
        )
      );
      assert.equal(
        simpleAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN
      );
      simpleAddon.removeModuleName();
      assert.equal(
        simpleAddon.moduleName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_COMPLEX_CUSTOM_PACKAGE_MAIN,
        'name is unchanged until write happens'
      );
      await simpleAddon.writePackageMainToDisk();
      assert.equal(
        simpleAddon.moduleName,
        undefined,
        'name is changed after the main is written'
      );
    });
  });
});
