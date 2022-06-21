import { describe, test, expect } from 'vitest';
import Node from '../../src/utils/node';
import Graph from '../../src/utils/graph';

describe('graph', () => {
  test('should addNode', async () => {
    const graph = new Graph();

    graph.addNode({
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
    });

    expect(graph.nodes.size).toEqual(1);
  });

  test('should addEdge to node', async () => {
    const graph = new Graph();

    const someParentNode = graph.addNode({
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
    });

    const someEdgeNode = new Node({
      pkg: {
        path: './',
        name: 'some-edge-node',
        dependencies: {
          'some-dep-a': '1.1.1',
        },
        devDependencies: {
          'some-dev-dev-b': '0.0.1',
        },
      },
      converted: false,
    });

    graph.addEdge(someParentNode, someEdgeNode);
    expect(graph.nodes.has(someParentNode)).toBeTruthy();
    const maybeParentNode = graph.nodes.values().next().value;
    expect(maybeParentNode).toBe(someParentNode);
    expect(maybeParentNode.adjacent.values().next().value).toBe(someEdgeNode);
  });
});
