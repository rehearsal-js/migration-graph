'use strict';

const t = require('@babel/types');
const parser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');

const { EmberPackage } = require('./ember-package');

const {
  getEmberAddonName,
  getModuleNameFromMain,
  getNameFromMain,
  getPackageMainAST,
  getPackageMainExportConfigFromASTNode,
  getPackageMainFileName,
  isEngine,
  writePackageMain,
} = require('../utils/ember');

class EmberAddonPackage extends EmberPackage {
  constructor() {
    super(...arguments);
    this.isAddon = true;
  }

  get isEngine() {
    return isEngine(this.path);
  }

  /**
   * The name should be the value from packageJson,
   * which is retrieved by Package.name
   */
  get name() {
    if (!this._internalState.name) {
      this._internalState.name = getNameFromMain(this.path);
    }
    return this._internalState.name;
  }

  // return the value of the field in the main
  get moduleName() {
    if (!this._internalState.moduleName) {
      this._internalState.moduleName = getModuleNameFromMain(this.path);
    }
    return this._internalState.moduleName;
  }

  get emberAddonName() {
    if (!this._internalState.emberAddonName) {
      this._internalState.emberAddonName = getEmberAddonName(this.path);
    }
    return this._internalState.emberAddonName;
  }

  get packageMain() {
    if (!this._internalState.packageMain) {
      this._internalState.packageMain = getPackageMainFileName(this.path);
    }
    return this._internalState.packageMain;
  }

  getPackageMainAST() {
    if (!this._internalState.packageMainAST) {
      this._internalState.packageMainAST = getPackageMainAST(
        this.path,
        this.packageMain
      );
    }
    return this._internalState.packageMainAST;
  }

  /**
   * Set the name property for the addon in the package main.
   */
  setAddonName(addonName) {
    traverse(this.getPackageMainAST(), {
      AssignmentExpression({ node }) {
        const configurationObject = getPackageMainExportConfigFromASTNode(node);

        if (configurationObject) {
          configurationObject.properties =
            configurationObject.properties.filter((p) => p.key.name !== 'name');
          // remove any existing name property to set the new one
          configurationObject.properties.push(
            t.objectProperty(t.identifier('name'), t.stringLiteral(addonName))
          );
        }
      },
    });
    return this;
  }

  /**
   * The moduleName is used by ember to identify an addon, this can be
   * different from the package.name.
   * The value is returned from a function named "moduleName" that is specified
   * in the "main" entrypoint of the package.
   *
   * This modifies the eport of the project main to have a `moduleName` property
   * that is a function that returns the string.
   * The main can export an object or function that returns an object.
   *
   * Setting the module name requires passing in a function that will be
   * output into the package main, override whatever was there.
   * @param moduleNameFunction function that returns a string
   * @return instance of EmberAddon
   */
  setModuleName(moduleName) {
    traverse(this.getPackageMainAST(), {
      AssignmentExpression({ node }) {
        const configurationObject = getPackageMainExportConfigFromASTNode(node);
        const moduleNameFunc = parser.parse(`() => '${moduleName}'`);
        configurationObject?.properties?.push(
          t.objectProperty(
            t.identifier('moduleName'),
            moduleNameFunc.program.body[0].expression
          )
        );
      },
    });
    return this;
  }

  /**
   * Remove the moduleName function from the package main.
   */
  removeModuleName() {
    traverse(this.getPackageMainAST(), {
      AssignmentExpression({ node }) {
        const configurationObject = getPackageMainExportConfigFromASTNode(node);
        configurationObject.properties = configurationObject.properties.filter(
          (p) => p.key.name !== 'moduleName'
        );
      },
    });
    return this;
  }

  writePackageMainToDisk() {
    return writePackageMain(
      this.path,
      this.getPackageMainAST(),
      this.packageMain
    ).then((res) => {
      // reset the internal state
      this._internalState = {};
      return res;
    });
  }
}

module.exports = {
  EmberAddonPackage,
};
