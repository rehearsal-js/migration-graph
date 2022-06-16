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

const { EmberPackage } = require('../../../-private/entities/ember-package');

// import the container so it can be called with the correct root
const Container = require('../../../index');

tmp.setGracefulCleanup();

function setupAddonFixtures(tmpLocation) {
  fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
}

qunitModule('Unit | EmberPackage', function (hooks) {
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

  qunitModule('addonPaths updates', function () {
    test('add an addonPath to a local dependency', function (assert) {
      const addonPackages = Container.getInternalAddonPackages(
        this.tmpLocation
      );

      const packageContainer = {
        getInternalAddonPackages: () => addonPackages,
      };

      const addon = new EmberPackage(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON),
        {
          packageContainer,
        }
      );

      assert.equal(addon.addonPaths.length, 0);

      addon.addAddonPath(
        addonPackages.mappingsByAddonName[PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE]
      );

      assert.equal(addon.addonPaths.length, 1);

      assert.equal(
        addon.addonPaths[0],
        path.relative(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON),
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
        )
      );
    });

    test('remove an addonPath to a local dependency', function (assert) {
      const addonPackages = Container.getInternalAddonPackages(
        this.tmpLocation
      );

      const packageContainer = {
        getInternalAddonPackages: () => addonPackages,
      };
      const addon = new EmberPackage(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE),
        {
          packageContainer,
        }
      );

      assert.equal(addon.addonPaths.length, 1);

      addon.removeAddonPath(
        addonPackages.mappingsByAddonName[PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON],
        packageContainer.getInternalAddonPackages().mappingsByAddonName
      );

      assert.equal(addon.addonPaths.length, 0);
    });

    test('does nothing if the desired addon is not part of `ember-addon.paths`', function (assert) {
      const addonPackages = Container.getInternalAddonPackages(
        this.tmpLocation
      );

      const packageContainer = {
        getInternalAddonPackages: () => addonPackages,
      };
      const addon = new EmberPackage(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE),
        {
          packageContainer,
        }
      );

      assert.equal(addon.addonPaths.length, 1);

      addon.removeAddonPath(
        addonPackages.mappingsByAddonName['addon-with-module-name'],
        packageContainer.getInternalAddonPackages().mappingsByAddonName
      );

      assert.equal(addon.addonPaths.length, 1);
    });
  });
});
