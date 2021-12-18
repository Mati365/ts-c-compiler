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
export abstract class GroupTreeVisitor<
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initForRootNode(node: T): this {
    return this;
  }

  override enter(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (!visitor)
      return;

    if (isInlineTreeVisitor(visitor)) {
      return visitor.enter.call(this, node);
    }

    this.initializeAndEnter(visitor, node);
    return false;
  }

  override leave(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (!visitor || !isInlineTreeVisitor(visitor))
      return;

    visitor.leave?.call(this, node);
  }

  initializeAndEnter<D extends GroupTreeVisitor<T>>(Visitor: Newable<D>, node: T): D {
    return (
      new Visitor()
        .setParentVisitor(this)
        .setContext(this.context)
        .initForRootNode(node)
        .visit(node)
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
