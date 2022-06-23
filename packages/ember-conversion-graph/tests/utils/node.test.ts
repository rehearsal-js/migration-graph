import { createNodeContent } from '../test-support';
import { describe, test, expect } from 'vitest';
import Node from '../../src/utils/node';

describe('node', () => {
  test('should create node', async () => {
    const content = createNodeContent('some-node');

    const node = new Node(content);
    expect(node.content.pkg.name).toEqual('some-node');
    expect(node.content).toEqual(content);
    expect(node.parent).toBe(null);
    expect(node.adjacent.size).toBe(0);
  });

  test('should have parent node', async () => {
    const child = new Node(createNodeContent('some-child'));
    const parent = new Node(createNodeContent('some-parent'));
    child.setParent(parent);
    expect(child.parent).toEqual(parent);
  });

  test('should have adjacent node', async () => {
    const node = new Node(createNodeContent('some-child'));
    const someAdjacentNode = new Node(createNodeContent('some-adjacent'));
    node.addAdjacent(someAdjacentNode);
    expect(node.adjacent.values().next().value).toEqual(someAdjacentNode);
  });
});
