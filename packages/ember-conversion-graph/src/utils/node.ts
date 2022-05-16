import { NodeContent } from '../types';

export default class Node {
  // eslint-disable-next-line no-use-before-define
  #parent: Node | null = null;

  // eslint-disable-next-line no-use-before-define
  #adjacent: Set<Node>;

  #content: NodeContent;

  constructor(content: NodeContent) {
    this.#content = content;
    this.#adjacent = new Set();
  }

  get content(): NodeContent {
    return this.#content;
  }

  get adjacent(): Set<Node> {
    return this.#adjacent;
  }

  get parent(): Node | null {
    return this.#parent;
  }

  setParent(node: Node): void {
    this.#parent = node;
  }

  addAdjacent(node: Node): void {
    node.setParent(this);
    this.#adjacent.add(node);
  }
}
