import * as R from 'ramda';

import {Newable} from '@compiler/core/types';
import {TreeNode} from './TreeNode';
import {TreeVisitor} from './TreeVisitor';

export type InlineTreeVisitor<T extends TreeNode<any>> = {
  enter?(node: T): void | boolean,
  leave?(node: T): void,
};

export type TreeVisitorsMap<T extends TreeNode<any>> = {
  [kind: string]: Newable<GroupTreeVisitor<T>> | InlineTreeVisitor<T> | false,
};

export function isInlineTreeVisitor(visitor: any): visitor is InlineTreeVisitor<any> {
  return R.is(Object, visitor) && (visitor.enter || visitor.leave);
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
  protected _context: C;

  static ofIterator<T extends TreeNode<any>>(visitorsMap: TreeVisitorsMap<T>) {
    return (tree: T) => new GroupTreeVisitor<T>(visitorsMap).visit(tree);
  }

  constructor(
    private visitorsMap: TreeVisitorsMap<T> = {},
  ) {
    super();
  }

  get context() { return this._context; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initForRootNode(node: T): this {
    return this;
  }

  override enter(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (visitor === false)
      return false;

    if (!visitor)
      return;

    if (isInlineTreeVisitor(visitor))
      return visitor.enter?.(node);

    this.initializeAndEnter(visitor, node);
    return false;
  }

  override leave(node: T) {
    const visitor = this.getNodeVisitor(node);
    if (!visitor || !isInlineTreeVisitor(visitor))
      return;

    visitor.leave?.(node);
  }

  initializeAndEnter<D extends GroupTreeVisitor<T>>(Visitor: Newable<D>, node: T): D {
    return (
      new Visitor()
        .setParentVisitor(this)
        .setContext(this._context)
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
    this._context = context;
    return this;
  }

  getNodeVisitor(node: T) {
    return this.visitorsMap[node.kind];
  }
}
