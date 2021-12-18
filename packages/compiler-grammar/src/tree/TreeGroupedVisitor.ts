import * as R from 'ramda';

import {Newable} from '@compiler/core/types';
import {TreeNode} from './TreeNode';
import {TreeVisitor} from './TreeVisitor';

export type InlineTreeVisitor<T extends TreeNode<any>> = {
  enter(node: T): void | boolean,
  leave?(node: T): void,
};

export type TreeVisitorsMap<T extends TreeNode<any>> = {
  [kind: string]: Newable<GroupTreeVisitor<T>> | InlineTreeVisitor<T>,
};

export function isInlineTreeVisitor(visitor: any): visitor is InlineTreeVisitor<any> {
  return R.is(Object, visitor) && visitor?.enter;
}

/**
 * Visitor that holds hash map of node-id => TreeVisitor
 *
 * @export
 * @class GroupTreeVisitor
 * @extends {TreeVisitor<T>}
 * @template T node type
 * @template P parent node type
 * @template C context type
 */
export class GroupTreeVisitor<
    T extends TreeNode<any> = TreeNode,
    P extends GroupTreeVisitor<T> = any,
    C extends {} = any> extends TreeVisitor<T> {
  protected parentVisitor: P;
  protected context: C;

  constructor(
    private visitorsMap: TreeVisitorsMap<T> = {},
  ) {
    super();
  }

  override enter(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (!visitor)
      return;

    if (isInlineTreeVisitor(visitor)) {
      return visitor.enter.call(this, node);
    }

    this
      .intantizeWithContext(visitor)
      .visit(node);

    return false;
  }

  override leave(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (!visitor || !isInlineTreeVisitor(visitor))
      return;

    visitor.leave?.call(this, node);
  }

  intantizeWithContext<D extends GroupTreeVisitor<T>>(Visitor: Newable<D>): D {
    return (
      new Visitor()
        .setParentVisitor(this)
        .setContext(this)
    );
  }

  setVisitorsMap(visitorsMap: TreeVisitorsMap<T>): this {
    this.visitorsMap = visitorsMap;
    return this;
  }

  setParentVisitor(visitor: P): this {
    this.parentVisitor = visitor;
    return this;
  }

  setContext(context: C): this {
    this.context = context;
    return this;
  }

  getNodeVisitor(node: T) {
    return this.visitorsMap[node.kind];
  }
}
