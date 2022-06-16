import Node from './node';

/**
 * Perform a DsFS for a given node.
 */
export default function* dfs(start: Node): Generator<Node> {
  const visited = new Set();
  const visitList: Node[] = [];

  visitList.push(start);

  while (visitList.length) {
    const node = visitList.pop();
    if (node && !visited.has(node)) {
      yield node;
      visited.add(node);
      node.adjacent.forEach((adj) => visitList.unshift(adj));
    }
  }
}
