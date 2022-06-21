import { describe, test, expect } from 'vitest';
import Node from '../../src/utils/node';

describe('node', () => {
  test('should create node', async () => {
    const content = {
      pkg: {
        path: './',
        name: 'some-node',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    };

    const node = new Node(content);
    expect(node.content.pkg.name).toEqual('some-node');
    expect(node.content).toEqual(content);
    expect(node.parent).toBe(null);
    expect(node.adjacent.size).toBe(0);
  });

  test('should have parent node', async () => {
    const child = new Node({
      pkg: {
        path: './',
        name: 'some-child',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    });
    const parent = new Node({
      pkg: {
        path: './',
        name: 'some-parent',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    });
    child.setParent(parent);
    expect(child.parent).toEqual(parent);
  });

  test('should have adjacent node', async () => {
    const node = new Node({
      pkg: {
        path: './',
        name: 'some-child',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    });
    const someAdjacentNode = new Node({
      pkg: {
        path: './',
        name: 'some-parent',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    });
    node.addAdjacent(someAdjacentNode);
    expect(node.adjacent.values().next().value).toEqual(someAdjacentNode);
  });
});
