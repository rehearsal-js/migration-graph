// TODO: Properly declare types in my-package-utils
// The hack below allows TypeScript consumers to use the module and transpile successfully, but it
// does not convey any type information so consumers don't get intellisense or build-time type
// checking; effectively the imports are all treated as 'any'

declare module '@rehearsal/ember-package-utils/module-mappings';
