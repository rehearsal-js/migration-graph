import Node from './node';

/**
 * Perform a BFS for a given node.
 */
export default function* bfs(start: Node): Generator<Node> {
  const visited = new Set();
  const visitList: Node[] = [];

  visitList.push(start);

  while (visitList.length) {
    const node = visitList.pop();
    if (node && !visited.has(node)) {
      yield node;
      visited.add(node);
      node.adjacent.forEach((adj) => visitList.push(adj));
    }
  }
  return visitList;
}
