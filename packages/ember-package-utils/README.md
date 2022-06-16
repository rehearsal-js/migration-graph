# package-util

## What is this?

A tool for reading and manipulating packages in a project.

## Usage

Primarily used in other scripts:

```
const {
  getInternalModuleMappings,
} = require('@rehearsal/ember-package-utils/module-mappings');

const { mappingsByAddonName } = getInternalModuleMappings();
```

## Tests

When running tests, ensure that `process.env.PACKAGE_UTILS_TESTING` is set to
`true`.
