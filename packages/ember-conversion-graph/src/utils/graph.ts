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
}
