# Node Memoize

## What is this?

This is used to memoize functions in node scripts.

## Usage

```
const { memoize } = require('@rehearsal/ember-shared');

const getAddonDependencies = memoize(
  function doSlowThing(param) {
    /* doing slow thing */
  },

  // key function
  ([param]) => param
);
```

## Tests

When running tests, ensure that `process.env.[anything]_TESTING` is set to
`true`.
