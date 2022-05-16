'use strict';

const QUnit = require('qunit');
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const { writePackageJson } = require('../../../-private/utils/package-json');

const { module: qunitModule, test } = QUnit;

tmp.setGracefulCleanup();

qunitModule('Unit | package-json', function (hooks) {
  hooks.beforeEach(function () {
    const { name: tmpLocation } = tmp.dirSync();
    this.tmpLocation = tmpLocation;
  });

  test('`writePackageJson` sorts the package', async function (assert) {
    await writePackageJson(this.tmpLocation, {
      aide: {},
      name: 'foo-bar-package',
      devDependencies: {},
      dependencies: {
        b: '*',
        a: '*',
      },
      'ember-addon': {
        paths: ['../b', '../a'],
      },
    });

    const pkg = await fs.promises.readFile(
      path.resolve(this.tmpLocation, 'package.json'),
      'utf-8'
    );

    assert.deepEqual(JSON.parse(pkg), {
      name: 'foo-bar-package',
      dependencies: {
        a: '*',
        b: '*',
      },
      devDependencies: {},
      aide: {},
      'ember-addon': {
        paths: ['../a', '../b'],
      },
    });
  });
});
