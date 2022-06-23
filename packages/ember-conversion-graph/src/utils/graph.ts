import { NodeContent } from '../types';
import Node from './node';
export default class Graph {
  #nodes: Set<Node>;

  constructor() {
    this.#nodes = new Set();
  }

  get nodes(): Set<Node> {
    return this.#nodes;
  }

  addNode(contents: NodeContent): Node {
    const newNode = new Node(contents);
    this.#nodes.add(newNode);
    return newNode;
  }

  addEdge(source: Node, destination: Node): Graph {
    source.addAdjacent(destination);
    return this;
  }

  topSort(): Node[] {
    let visited = new Set<Node>();
    let stack = new Array<Node>();

    Array.from(this.#nodes).forEach((node: Node) => {
      if (!visited.has(node)) {
        // const iterator = topSort(node, visited);
        this.topSortUtil(node, visited, stack);
      }
    });

    return stack; // stack.reverse();
  }

  private topSortUtil(
    node: Node,
    visited = new Set<Node>(),
    stack = new Array<Node>()
  ) {
    visited.add(node);

    node.adjacent.forEach((adj) => {
      if (adj && !visited.has(adj)) {
        this.topSortUtil(adj, visited, stack);
      }
    });

    stack.push(node);
  }
}
