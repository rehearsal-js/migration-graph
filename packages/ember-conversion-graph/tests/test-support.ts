import { NodeContent } from '../src/types';

export function createNodeContent(name: string = 'some-name'): NodeContent {
  return {
    pkg: {
      path: './',
      name,
      dependencies: {},
      devDependencies: {},
    },
    converted: false,
  };
}
