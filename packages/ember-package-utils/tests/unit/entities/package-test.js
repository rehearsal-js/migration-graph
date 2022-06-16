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

const { readPackageJsonSync } = require('../../../-private/utils/package-json');

const { Package } = require('../../../-private/entities/package');

tmp.setGracefulCleanup();

function setupAddonFixtures(tmpLocation) {
  fixturify.writeSync(tmpLocation, PACKAGE_FIXTURES);
}

qunitModule('Unit | Package', function (hooks) {
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
    test('packageName', function (assert) {
      assert.equal(
        new Package(
          path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
        ).packageName,
        PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON
      );
      assert.equal(
        new Package(
          path.resolve(
            this.tmpLocation,
            PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME
          )
        ).packageName,
        PACKAGE_FIXTURE_NAMES.ADDON_WITH_MODULE_NAME,
        'fetch the name property even if module name is defined'
      );
    });

    test('packageJson', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      ).getPackageJson();

      // returns an object
      assert.equal(typeof _package, 'object');
      // has expected fields
      assert.ok(_package.name);
      assert.ok(_package.version);
      assert.ok(_package.keywords);
    });
  });

  qunitModule('package updates', function () {
    test('setPackageName', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(_package.packageName, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON);
      _package.setPackageName('taco');
      assert.equal(_package.packageName, 'taco');
    });

    test('addPackageJsonKey - simple', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(_package.getPackageJson().taco, undefined);
      _package.addPackageJsonKey('taco', 5);
      assert.equal(_package.getPackageJson().taco, 5);
    });

    test('addPackageJsonKey - complex', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(_package.getPackageJson().taco, undefined);
      _package.addPackageJsonKey('taco', { total: 5 });
      assert.equal(
        _package.getPackageJson().taco.total,
        5,
        'passing an object works'
      );
      _package.addPackageJsonKey(
        'foo.bar.baz',
        'bold of you to assume good naming'
      );
      assert.ok(_package.getPackageJson().foo, 'top level field was added');
      assert.ok(
        _package.getPackageJson().foo.bar,
        'penultimate field was added'
      );
      assert.ok(_package.getPackageJson().foo.bar.baz, 'leaf field was added');
      assert.equal(
        _package.getPackageJson().foo.bar.baz,
        'bold of you to assume good naming'
      );
    });

    test('removePackageJsonKey - simple', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(
        _package.getPackageJson().name,
        PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON
      );
      _package.removePackageJsonKey('name');
      assert.equal(_package.getPackageJson().name, undefined);
    });

    test('removePackageJsonKey - complex', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
      );
      assert.equal(
        _package.getPackageJson()['ember-addon'].paths.length,
        1,
        'ember-addon.paths has 1 entry'
      );
      _package.removePackageJsonKey('ember-addon.paths');
      assert.equal(
        _package.getPackageJson()['ember-addon'].paths,
        undefined,
        'ember-addon.paths is gone'
      );
    });

    test('addDependency', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(_package.getPackageJson().dependencies, undefined);
      _package.addDependency('foo', '1.0.0');
      assert.equal(
        Object.keys(_package.getPackageJson().dependencies).length,
        1
      );
      assert.equal(_package.getPackageJson().dependencies.foo, '1.0.0');
    });

    test('removeDependency', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
      );
      assert.equal(
        Object.keys(_package.getPackageJson().dependencies).length,
        1
      );
      _package.removeDependency('foo');
      assert.equal(
        Object.keys(_package.getPackageJson().dependencies).length,
        0
      );
    });

    test('addDevDependency', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ADDON)
      );
      assert.equal(_package.getPackageJson().devDependencies, undefined);
      _package.addDevDependency('foo', '1.0.0');
      assert.equal(
        Object.keys(_package.getPackageJson().devDependencies).length,
        1
      );
      assert.equal(_package.getPackageJson().devDependencies.foo, '1.0.0');
    });

    test('removeDevDependency', function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
      );
      assert.equal(
        Object.keys(_package.getPackageJson().devDependencies).length,
        1
      );
      _package.removeDevDependency('bar');
      assert.equal(
        Object.keys(_package.getPackageJson().devDependencies).length,
        0
      );
    });

    test('writePackageJsonToDisk', async function (assert) {
      const _package = new Package(
        path.resolve(this.tmpLocation, PACKAGE_FIXTURE_NAMES.SIMPLE_ENGINE)
      );
      const originalJson = _package.getPackageJson();
      assert.equal(originalJson.taco, undefined);
      _package.addPackageJsonKey('taco', 'al pastor');
      await _package.writePackageJsonToDisk();
      assert.equal(readPackageJsonSync(_package.path).taco, 'al pastor');
    });
  });
});
