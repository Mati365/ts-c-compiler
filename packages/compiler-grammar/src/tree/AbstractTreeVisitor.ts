import {NodeLocation} from './NodeLocation';

export type IsWalkableNode  = {
  loc?: NodeLocation,
  walk(visitor: AbstractTreeVisitor<any>): void;
};

export class AbstractTreeVisitor<T extends IsWalkableNode = any> {
  protected history: T[] = [];

  get nesting() { return this.history.length; }

  /**
   * Abstract tree iterator
   *
   * @param {T} node
   * @return {this}
   * @memberof AbstractTreeVisitor
   */
  visit(node: T): this {
    const {history} = this;

    history.push(node);

    try {
      const result = this.enter?.(node, history);
      if (result !== false)
        node.walk(this);

      this.leave?.(node, history); // eslint-disable-line no-unused-expressions
    } catch (e) {
      e.loc = e.loc ?? node.loc?.start;

      throw e;
    }

    history.pop();

    return this;
  }

  enter?(node: T, history: T[]): void | boolean;
  leave?(node: T, history: T[]): void;
}
