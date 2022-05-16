'use strict';

const {
  readPackageJsonSync,
  writePackageJson,
} = require('../utils/package-json');

const { getWorkspaceGlobs } = require('../utils/workspace');

const {
  setNestedPropertyValue,
  removeNestedPropertyValue,
} = require('../utils/pojo');

/**
 * Package Class
 *  - constructor(path)
 *  - static methods to migrate existing stuff
 *  - manipulation functions
 *    - add/removeDependency
 *    - add/removeDevDependency
 *    - add/removeInRepoDependency
 *    - add/removeInRepoDevDependency
 *    - setModuleName
 *
 * Implementation Details
 *  - removeInRepo*
 *    - if workspace, manipulate deps and devDeps
 *    - else, remove addon-paths
 */
class Package {
  /**
   * path {string} - the path to this package
   */
  #path;

  /**
   * Internal representation of package.json
   */
  #pkg;

  #type;

  #packageContainer;

  constructor(pathToPackage, { type = '', packageContainer = null } = {}) {
    this.#path = pathToPackage;

    this.type = type;
    this.#packageContainer = packageContainer;
  }

  set type(_type) {
    this.#type = _type;
  }

  set path(_path) {
    this.#path = _path;
  }

  set packageContainer(container) {
    this.#packageContainer = container;
  }

  get type() {
    return this.#type;
  }

  get path() {
    return this.#path;
  }

  get location() {
    return this.#path;
  }

  get packagePath() {
    return this.#path;
  }

  get packageName() {
    return this.getPackageJson().name;
  }

  get packageContainer() {
    return this.#packageContainer;
  }

  get isWorkspace() {
    return this.#packageContainer.isWorkspace(this.path);
  }

  getPackageJson() {
    if (!this.#pkg) {
      this.#pkg = readPackageJsonSync(this.path);
    }
    return this.#pkg;
  }

  /**
   * EXPLICIT DEPENDENCIES
   * These the items listed in package.json, different from *required*
   * dependencies wich are actually _used_ by the package (i.e. referenced in the code)
   *
   * It is technically possible to have zero dependencies
   * @return dependencies {object|undefined}
   */
  get dependencies() {
    // get the dependencies from package.json
    return this.getPackageJson().dependencies;
  }

  /**
   * These the items listed in package.json
   *
   * It is technically possible to have zero devDependencies
   * @return dependencies {object|undefined}
   */
  get devDependencies() {
    // get the dependencies from package.json
    return this.getPackageJson().devDependencies;
  }

  /**
   * Return any workspace globs this package might have.
   */
  get workspaceGlobs() {
    return getWorkspaceGlobs(this.path);
  }

  addWorkspaceGlob(glob) {
    const pkg = this.getPackageJson();
    if (!pkg.workspaces) {
      pkg.workspaces = [];
    }
    pkg.workspaces.push(glob);
    return this;
  }

  setPackageName(name) {
    this.getPackageJson().name = name;
    return this;
  }

  /**
   * ex, addPackageJsonKey('foo.bar.baz', 5) ->
   *  { foo: {bar: {baz: 5}}}
   */
  addPackageJsonKey(key, value = {}) {
    // update the package to add the thing
    setNestedPropertyValue(this.getPackageJson(), key.split('.'), value);
    return this;
  }

  removePackageJsonKey(key) {
    // update the package to remove the thing
    removeNestedPropertyValue(this.getPackageJson(), key.split('.'));
    return this;
  }

  addDependency(packageName, version) {
    // add to dependencies
    let _dependencies = this.dependencies;
    if (!_dependencies) {
      this.#pkg.dependencies = {};
      _dependencies = this.#pkg.dependencies;
    }
    _dependencies[packageName] = version;
    return this;
  }

  removeDependency(packageName) {
    // remove from dependencoes
    delete this.getPackageJson().dependencies?.[packageName];
    return this;
  }

  addDevDependency(packageName, version) {
    let _devDependencies = this.devDependencies;
    if (!_devDependencies) {
      this.#pkg.devDependencies = {};
      _devDependencies = this.#pkg.devDependencies;
    }
    _devDependencies[packageName] = version;
    return this;
  }

  removeDevDependency(packageName) {
    delete this.devDependencies?.[packageName];
    return this;
  }

  /**
   * Write the packageJson data to disk.
   * Writes a async, unlikes reads which are sync, so consumers of this could write
   * multiple packages at once.
   * @returns Promise
   */
  writePackageJsonToDisk() {
    return writePackageJson(this.path, this.getPackageJson());
  }
}

module.exports = {
  Package,
};
