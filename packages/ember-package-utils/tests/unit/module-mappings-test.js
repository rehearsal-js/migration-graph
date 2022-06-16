'use strict';

const QUnit = require('qunit');
const tmp = require('tmp');
const fixturify = require('fixturify');
const path = require('path');
const fs = require('fs');
const walkSync = require('walk-sync');

const {
  registerInternalAddonTestFixtures,
  setupTestEnvironment,
  resetInternalAddonTestFixtures,
} = require('../../utils/test-environment');

const {
  PACKAGE_FIXTURE_NAMES,
  PACKAGE_FIXTURES,
} = require('../fixtures/package-fixtures');

const {
  getInternalModuleMappings,
  getExternalModuleMappings,
} = require('../../index');

const { module: qunitModule, test } = QUnit;

tmp.setGracefulCleanup();

function json(jsonObj = {}) {
  return JSON.stringify(jsonObj, null, 2);
}

qunitModule('Unit | module-mappings', () => {
  qunitModule('`getInternalModuleMappings`', function (hooks) {
    function setupInternalAddonFixtures(tmpLocation) {
      fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
    }

    hooks.beforeEach(function () {
      setupTestEnvironment();
      const { name: tmpLocation } = tmp.dirSync();
      this.tmpLocation = tmpLocation;
      setupInternalAddonFixtures(this.tmpLocation);

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

    test('the correct internal module-mappings exist for simple mappings', function (assert) {
      const { mappingsByAddonName, mappingsByLocation } =
        getInternalModuleMappings(this.tmpLocation);

      const simpleAddon =
        mappingsByAddonName[PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON];
      const simpleEngine =
        mappingsByAddonName[PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE];

      assert.ok(
        simpleAddon,
        `module mappings exists for '${PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE}'`
      );
      assert.ok(
        simpleEngine,
        `module mappings exists for '${PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE}'`
      );

      assert.strictEqual(
        simpleAddon,
        mappingsByLocation[simpleAddon.location],
        'an associated mapping by location exists for `foo`'
      );

      assert.strictEqual(
        simpleEngine,
        mappingsByLocation[simpleEngine.location],
        'an associated mapping by location exists for `bar`'
      );

      assert.strictEqual(
        simpleAddon.location,
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON),
        `${simpleAddon.name}'s location is correct`
      );

      assert.strictEqual(
        simpleEngine.location,
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE),
        `${simpleEngine.name}'s location is correct`
      );
    });

    test('it works correctly for addons that specify a custom `moduleName`', function (assert) {
      const { mappingsByAddonName } = getInternalModuleMappings(
        this.tmpLocation
      );

      const customAddonName =
        mappingsByAddonName[PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME];

      assert.ok(
        customAddonName,
        'module mappings exists for `addon-with-module-name`'
      );

      assert.strictEqual(
        customAddonName.moduleName,
        `${PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME}-SPECIFIED-IN-MODULENAME`
      );
      assert.strictEqual(customAddonName.packageName, 'addon-with-module-name');
    });

    test('it works correctly workspace packages', function (assert) {
      const { mappingsByAddonName } = getInternalModuleMappings(
        path.resolve(
          this.tmpLocation,
          PACKAGE_FIXTURE_NAMES.WORKSPACE_CONTAINER
        )
      );

      const simpleWorkspace =
        mappingsByAddonName[
          PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON_IN_WORSKAPCE_CONTAINER
        ];

      assert.ok(simpleWorkspace, 'module mappings exists for `foo-workspace`');
      assert.strictEqual(simpleWorkspace.isWorkspace, true);
    });

    test('it works correctly for addons with a custom addon main file', function (assert) {
      const { mappingsByAddonName } = getInternalModuleMappings(
        this.tmpLocation
      );

      assert.ok(
        mappingsByAddonName[
          PACKAGE_FIXTURE_NAMES.ADDON_WITH_SIMPLE_CUSTOM_PACKAGE_MAIN
        ],
        'an internal module mapping exists for `addon-with-custom-main`'
      );
    });
  });

  qunitModule('`getExternalModuleMappings`', function (hooks) {
    function setupExternalAddonFixtures(tmpLocation) {
      fixturify.writeSync(tmpLocation, {
        'package.json': json({
          name: 'root-package',
          private: true,
          workspaces: ['packages/*'],
          dependencies: {
            'foo-external-addon': '*',
          },
        }),
        node_modules: {
          'foo-external-addon': {
            'index.js': fs.readFileSync(
              path.join(
                __dirname,
                '..',
                'fixtures',
                'simple-addon',
                'index.js'
              ),
              'utf-8'
            ),
            'package.json': json({
              name: 'foo-external-addon',
              version: '1.0.0',
              keywords: ['ember-addon'],
              'ember-addon': {
                paths: [],
              },
            }),
          },
        },
      });
    }

    hooks.beforeEach(function () {
      setupTestEnvironment();
      const { name: tmpLocation } = tmp.dirSync();
      this.tmpLocation = tmpLocation;
      setupExternalAddonFixtures(this.tmpLocation);

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

    test('the correct external module mappings exist', function (assert) {
      const { mappingsByAddonName, mappingsByLocation } =
        getExternalModuleMappings(this.tmpLocation);

      const { 'foo-external-addon': fooExternalAddon } = mappingsByAddonName;

      assert.ok(
        fooExternalAddon,
        'module mappings exists for `foo-external-addon`'
      );

      assert.strictEqual(
        fooExternalAddon,
        mappingsByLocation[fooExternalAddon.location],
        'an associated mapping by location exists for `foo-external-addon`'
      );

      assert.strictEqual(
        fs.realpathSync(fooExternalAddon.location),
        fs.realpathSync(
          path.resolve(this.tmpLocation, 'node_modules', 'foo-external-addon')
        ),
        "`foo-external-addon`'s location is correct"
      );
    });
  });
});
