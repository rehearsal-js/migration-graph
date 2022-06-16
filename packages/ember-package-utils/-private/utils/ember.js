'use strict';

const path = require('path');
const parser = require('@babel/parser');
const { runPrettier } = require('./run-prettier');
const { default: generate } = require('@babel/generator');
const { readFileSync, writeFile } = require('./disk');
const { readPackageJsonSync } = require('./package-json');

/**
 * A package is an addon if the keywords property exists and contains "ember-addon"
 *
 * @param {string} pathToPackage - the path to the addon directory
 * @returns {boolean}
 */
function isAddon(pathToPackage) {
  const packageJSONData = readPackageJsonSync(pathToPackage);
  return packageJSONData?.keywords?.includes('ember-addon') ?? false;
}

/**
 * A package is an engine if it is an addon, and if the keywords property contains "ember-addon"
 *
 * @param {string} pathToPackage - the path to the addon directory
 * @returns {boolean}
 */
function isEngine(pathToPackage) {
  const packageJSONData = readPackageJsonSync(pathToPackage);

  return (
    (isAddon(pathToPackage) &&
      packageJSONData?.keywords?.includes('ember-engine')) ??
    false
  );
}

function getPackageMainFileName(pathToPackage) {
  const { main, 'ember-addon': emberAddon = {} } =
    readPackageJsonSync(pathToPackage);

  return emberAddon?.main ?? main ?? 'index.js';
}

/**
 * Ember addons can set a `ember-addon.main`, which takes precedence over the package.json `main`,
 * this finds the desired main entry point and requires it.
 * This also handles the default cause of using `index.js`
 * @param {string} pathToPackage - the path to the addon directory
 * @param {string} packageMain - the actual main file (index.js)
 * @param {boolean} clearCache - clear the cache before requiring
 * @returns {string} - the contents of the required file
 */
function requirePackageMain(
  pathToPackage,
  packageMain = getPackageMainFileName(pathToPackage),
  clearCache = true
) {
  // clear the node require cache to make sure the latest version on disk is required (i.e. after new data has been written)
  if (clearCache) {
    delete require.cache[
      require.resolve(path.resolve(pathToPackage, packageMain))
    ];
  }
  return require(path.resolve(pathToPackage, packageMain));
}

function getPackageMainAST(
  pathToPackage,
  packageMain = getPackageMainFileName(pathToPackage)
) {
  return parser.parse(readFileSync(path.resolve(pathToPackage, packageMain)), {
    sourceFilename: packageMain,
  });
}

/**
 * The variations will be hardcoded as they come up, so far there are:
 * ```
 *  module.exports = {};
 *  module.exports = function({})
 *  module.exports = function('string', {})
 *  module.exports = function('string', [Class].extend({})
 * ```
 */
function getPackageMainExportConfigFromASTNode(node) {
  let configurationObject;
  if (node?.left?.property?.name === 'exports') {
    // object case
    // simple object as second param
    if (node.right.type === 'ObjectExpression') {
      configurationObject = node.right;
    } else if (node.right.type === 'CallExpression') {
      const exportFunctionArguments = node.right.arguments;

      // module.exports = addon({})
      if (exportFunctionArguments[0].type === 'ObjectExpression') {
        [configurationObject] = exportFunctionArguments;
      }
      // TODO Rename this; module.exports = voyagerAddon(__dirname, {})
      else if (exportFunctionArguments[1].type === 'ObjectExpression') {
        [, configurationObject] = exportFunctionArguments;
      }
      // TODO Rename this; module.exports = voyagerAddon(__dirname, BPREngineAddon.extend({});
      else if (exportFunctionArguments[1].type === 'CallExpression') {
        [configurationObject] = exportFunctionArguments[1].arguments;
      }
    }
  }
  return configurationObject;
}

function writePackageMain(
  pathToPackage,
  packageMainAST,
  packageMain = getPackageMainFileName(pathToPackage)
) {
  // if prettier is required, run it on the generated string from generate: ex. prettier(generate())
  return writeFile(
    path.resolve(pathToPackage, packageMain),
    runPrettier(generate(packageMainAST).code, packageMain)
  );
}

function getNameFromMain(pathToPackage) {
  const addonEntryPoint = requirePackageMain(pathToPackage);

  const isFunction = typeof addonEntryPoint === 'function';

  let name;
  if (isFunction) {
    ({ name } = addonEntryPoint.prototype);
  } else {
    ({ name } = addonEntryPoint);
  }
  return name;
}

function getModuleNameFromMain(pathToPackage) {
  const addonEntryPoint = requirePackageMain(pathToPackage);

  const isFunction = typeof addonEntryPoint === 'function';

  let moduleName;
  if (isFunction) {
    moduleName =
      addonEntryPoint.prototype.moduleName &&
      addonEntryPoint.prototype.moduleName();
  } else {
    moduleName = addonEntryPoint.moduleName && addonEntryPoint.moduleName();
  }
  return moduleName;
}

/**
 * Ember addons can specify their "name" in a few ways.
 * All three are defined in the in main entry point of the package (index.js or a custom file)
 * - `name` as a string property
 * - `moduleName` function that returns a string
 *
 * This will find the appropriate field and return the "name" of the addon.
 * @param {string} pathToPackage - the path to the addon directory
 * @returns {string} - the name of the addon
 */
function getEmberAddonName(pathToPackage) {
  const name = getNameFromMain(pathToPackage);
  const moduleName = getModuleNameFromMain(pathToPackage);
  return moduleName ?? name;
}

module.exports = {
  isAddon,
  isEngine,
  getEmberAddonName,
  getPackageMainFileName,
  requirePackageMain,
  getPackageMainAST,
  getPackageMainExportConfigFromASTNode,
  writePackageMain,
  getNameFromMain,
  getModuleNameFromMain,
};
