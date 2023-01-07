import * as R from 'ramda';
import { NodeLocation } from './NodeLocation';

export type IsWalkableNode = {
  loc?: NodeLocation;
  walk(visitor: AbstractTreeVisitor<any>): void;
};

export function isWalkableNode(node: any): node is IsWalkableNode {
  return R.is(Object, node) && 'walk' in node;
}

export class AbstractTreeVisitor<T extends any = any> {
  protected history: T[] = [];

  get nesting() {
    return this.history.length;
  }

  /**
   * Abstract tree iterator
   */
  visit(node: T): this {
    const { history } = this;

    history.push(node);

    try {
      const result = this.enter?.(node, history);
      if (result !== false) {
        if (isWalkableNode(node) && this.shouldVisitNode?.(node) !== false) {
          node.walk(this);
        }

        this.leave?.(node, history); // eslint-disable-line no-unused-expressions
      }
    } catch (e) {
      if (isWalkableNode(node)) {
        e.loc = e.loc ?? node.loc?.start;
      }

      throw e;
    }

    history.pop();

    return this;
  }

  shouldVisitNode?(node: T): boolean;
  enter?(node: T, history: T[]): void | boolean;
  leave?(node: T, history: T[]): void;
}
