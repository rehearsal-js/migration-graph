'use strict';

const path = require('path');
const fastglob = require('fast-glob');
const resolvePackagePath = require('resolve-package-path');
const { getInternalAddonTestFixtures } = require('./utils/test-environment');
const {
  EmberAddonPackage,
} = require('./-private/entities/ember-addon-package');
const { Package } = require('./-private/entities/package');
const { EmberPackage } = require('./-private/entities/ember-package');
const { isWorkspace } = require('./-private/utils/workspace');
const { readPackageJsonSync } = require('./-private/utils/package-json');
const { isTesting } = require('./utils/test-environment');

function entityFactory(pathToPackage, options) {
  let Klass = Package;
  try {
    const packageData = readPackageJsonSync(pathToPackage);
    if (packageData?.keywords?.includes('ember-addon')) {
      Klass = EmberAddonPackage;
    } else if (packageData['ember-addon']) {
      Klass = EmberPackage;
    }
  } catch (e) {
    console.log(`Failed to read pathToPackage: ${pathToPackage}`);
  }

  return new Klass(pathToPackage, options);
}

class MappingsContainer {
  #internalState;

  constructor() {
    this.#internalState = {};
  }

  get #packageContainerInterface() {
    return {
      getInternalPackages: this.getInternalPackages.bind(this),
      getExternalPackages: this.getExternalPackages.bind(this),
      getExternalAddonPackages: this.getExternalAddonPackages.bind(this),
      getInternalAddonPackages: this.getInternalAddonPackages.bind(this),
      getAddonPackages: this.getAddonPackages.bind(this),
      isWorkspace: this.isWorkspace.bind(this),
      addWorkspaceGlob: this.addWorkspaceGlob.bind(this),
      getRootPackage: this.getRootPackage.bind(this),
    };
  }

  #clearCache() {
    this.#internalState = {};
  }

  getRootPackage(pathToRoot) {
    this.#setRootPackage(pathToRoot);
    return this.#internalState.rootPackage;
  }

  isWorkspace(pathToPackage) {
    return isWorkspace(this.#internalState.rootPackage.path, pathToPackage);
  }

  addWorkspaceGlob(glob) {
    this.#internalState.rootPackage.addWorkspaceGlob(glob);
    return this;
  }

  #setRootPackage(pathToRoot) {
    if (
      isTesting() ||
      !this.#internalState.rootPackage ||
      this.#internalState.rootPackage.path !== pathToRoot
    ) {
      this.#clearCache();
      this.#internalState.rootPackage = entityFactory(pathToRoot, {
        packageContainer: this.#packageContainerInterface,
      });
    }
  }

  /**
   * Get the external mappings for a given directory.
   * Traverses the node_modules and maps the packages by name and location.
   *
   * @param {string} pathToRoot - defaults to current working directory
   * @return {object} object with mappingsByName and mappingsByLocation
   */
  getExternalPackages(pathToRoot = process.cwd(), clearCache = false) {
    if (clearCache) {
      this.#clearCache();
    }
    this.#setRootPackage(pathToRoot);

    if (isTesting() || !this.#internalState.externalAddonPackages) {
      const mappingsByAddonName = {};
      const mappingsByLocation = {};

      const { dependencies = {}, devDependencies = {} } =
        this.#internalState.rootPackage;

      const emberAddons = Object.keys({
        ...dependencies,
        ...devDependencies,
      })
        .map((dependency) => resolvePackagePath(dependency, pathToRoot))
        .filter((pathToPackage) => !!pathToPackage)
        .map((pathToPackage) =>
          entityFactory(path.dirname(pathToPackage), {
            type: 'node_modules',
            packageContainer: this.#packageContainerInterface,
          })
        );

      for (const emberAddonPackage of emberAddons) {
        mappingsByAddonName[emberAddonPackage.packageName] = emberAddonPackage;
        mappingsByLocation[emberAddonPackage.location] = emberAddonPackage;
      }

      this.#internalState.externalAddonPackages = {
        mappingsByAddonName,
        mappingsByLocation,
      };
    }
    return this.#internalState.externalAddonPackages;
  }

  /**
   * Get the external mappings for a given directory.
   * Traverses the node_modules and maps the packages by name and location.
   *
   * @param {string} pathToRoot - defaults to current working directory
   * @return {object} object with mappingsByName and mappingsByLocation
   */
  getExternalAddonPackages(pathToRoot = process.cwd(), clearCache = false) {
    if (clearCache) {
      this.#clearCache();
    }
    this.#setRootPackage(pathToRoot);

    if (isTesting() || !this.#internalState.externalAddonPackages) {
      const mappingsByAddonName = {};
      const mappingsByLocation = {};

      const { dependencies = {}, devDependencies = {} } =
        this.#internalState.rootPackage;

      const emberAddons = Object.keys({
        ...dependencies,
        ...devDependencies,
      })
        .map((dependency) => resolvePackagePath(dependency, pathToRoot))
        .filter((pathToPackage) => !!pathToPackage)
        .map((pathToPackage) =>
          entityFactory(path.dirname(pathToPackage), {
            type: 'node_modules',
            packageContainer: this.#packageContainerInterface,
          })
        )
        .filter((addon) => addon.isAddon);

      for (const emberAddonPackage of emberAddons) {
        mappingsByAddonName[emberAddonPackage.packageName] = emberAddonPackage;
        mappingsByLocation[emberAddonPackage.location] = emberAddonPackage;
      }

      this.#internalState.externalAddonPackages = {
        mappingsByAddonName,
        mappingsByLocation,
      };
    }
    return this.#internalState.externalAddonPackages;
  }

  #globInternalPackages(pathToRoot) {
    const appPackages = fastglob
      .sync(
        [
          '**/package.json',
          '!**/build/**',
          '!**/dist/**',
          '!**/blueprints/**',
          '!**/fixtures/**',
          '!**/node_modules/**',
          '!**/tmp/**',
        ],
        {
          absolute: true,
          cwd: pathToRoot,
        }
      )
      .map((pathToPackage) => path.dirname(pathToPackage))
      .map((pathToPackage) =>
        entityFactory(pathToPackage, {
          type: 'in-repo',
          packageContainer: this.#packageContainerInterface,
        })
      );

    const fixturePackages = getInternalAddonTestFixtures().map((fixturePath) =>
      entityFactory(fixturePath, {
        type: 'in-repo',
        packageContainer: this.#packageContainerInterface,
      })
    );

    return [...appPackages, ...fixturePackages];
  }

  getInternalPackages(pathToRoot = process.cwd(), clearCache = false) {
    if (clearCache) {
      this.#clearCache();
    }

    this.#setRootPackage(pathToRoot);

    if (isTesting() || !this.#internalState.interalAddonPackges) {
      const mappingsByAddonName = {};
      const mappingsByLocation = {};

      const internalEmberAddons = this.#globInternalPackages(pathToRoot);

      for (const emberAddonPackage of internalEmberAddons) {
        mappingsByAddonName[emberAddonPackage.packageName] = emberAddonPackage;
        mappingsByLocation[emberAddonPackage.location] = emberAddonPackage;
      }

      this.#internalState.interalAddonPackges = {
        mappingsByAddonName,
        mappingsByLocation,
      };
    }

    return this.#internalState.interalAddonPackges;
  }

  /**
   * Get the internal mappings for a given directory.
   * Traverses the internal packages (using a glob)
   * and maps the packages by name and location.
   *
   * @param {string} pathToRoot - defaults to current working directory
   * @return {object} object with mappingsByName and mappingsByLocation
   */
  getInternalAddonPackages(pathToRoot = process.cwd(), clearCache = false) {
    if (clearCache) {
      this.#clearCache();
    }
    this.#setRootPackage(pathToRoot);

    if (isTesting() || !this.#internalState.interalAddonPackges) {
      const mappingsByAddonName = {};
      const mappingsByLocation = {};

      const internalEmberAddons = this.#globInternalPackages(pathToRoot).filter(
        (addon) => !!addon.isAddon
      );

      for (const emberAddonPackage of internalEmberAddons) {
        mappingsByAddonName[emberAddonPackage.packageName] = emberAddonPackage;
        mappingsByLocation[emberAddonPackage.location] = emberAddonPackage;
      }
      this.#internalState.interalAddonPackges = {
        mappingsByAddonName,
        mappingsByLocation,
      };
    }
    return this.#internalState.interalAddonPackges;
  }

  /**
   * Get the internal and external mappings for a given directory.
   * Traverses the node_modules and internal packages (using a glob)
   * and maps the packages by name and location.
   *
   * @param {string} pathToRoot - defaults to current working directory
   * @return {object} contains internalMappings and externalMappings
   */
  getAddonPackages(pathToRoot = process.cwd(), clearCache = false) {
    if (clearCache) {
      this.#clearCache();
    }
    this.#setRootPackage(pathToRoot);

    if (isTesting() || !this.#internalState.addonPackges) {
      const mappings = { mappingsByAddonName: {}, mappingsByLocation: {} };
      const internalMappings = this.getInternalAddonPackages(pathToRoot);
      const externalMappings = this.getExternalAddonPackages(pathToRoot);

      Object.assign(
        mappings.mappingsByAddonName,
        internalMappings.mappingsByAddonName
      );

      Object.assign(
        mappings.mappingsByAddonName,
        externalMappings.mappingsByAddonName
      );

      Object.assign(
        mappings.mappingsByLocation,
        internalMappings.mappingsByLocation
      );

      Object.assign(
        mappings.mappingsByLocation,
        externalMappings.mappingsByLocation
      );
      this.#internalState.addonPackges = mappings;
    }
    return this.#internalState.addonPackges;
  }
}

// create an instance that will maintain state
const _INSTANCE = new MappingsContainer();

// export an object with the methods bound to the instance
module.exports = {
  getRootPackage: _INSTANCE.getRootPackage.bind(_INSTANCE),
  getInternalPackages: _INSTANCE.getInternalPackages.bind(_INSTANCE),
  getExternalPackages: _INSTANCE.getExternalPackages.bind(_INSTANCE),
  getAddonPackages: _INSTANCE.getAddonPackages.bind(_INSTANCE),
  getInternalAddonPackages: _INSTANCE.getInternalAddonPackages.bind(_INSTANCE),
  getExternalAddonPackages: _INSTANCE.getExternalAddonPackages.bind(_INSTANCE),
  getModuleMappings: _INSTANCE.getAddonPackages.bind(_INSTANCE),
  getInternalModuleMappings: _INSTANCE.getInternalAddonPackages.bind(_INSTANCE),
  getExternalModuleMappings: _INSTANCE.getExternalAddonPackages.bind(_INSTANCE),
};
