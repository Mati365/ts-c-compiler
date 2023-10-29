import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-c/core';
import { TokenType } from '@ts-c/lexer';

import { walkOverFields } from '../decorators/walkOverFields';
import { NodeLocation } from './NodeLocation';
import { TreeVisitor } from './TreeVisitor';
import { IsWalkableNode } from './AbstractTreeVisitor';

export function isTreeNode(item: any): item is TreeNode<any> {
  return item && R.is(Object, item) && 'walk' in item;
}

/**
 * Node used to construct AST
 */
export class TreeNode<K = string, C extends TreeNode<K, C> = any>
  implements IsWalkableNode
{
  constructor(
    readonly kind: K,
    readonly loc: NodeLocation,
    public children: C[] = null,
  ) {}

  /**
   * Create shallow copy of object
   */
  clone(): TreeNode<K, C> {
    const { kind, loc, children } = this;

    return new TreeNode(kind, loc, children);
  }

  /**
   * Iterates throught tree
   */
  walk(visitor: TreeVisitor<TreeNode<K>>): void {
    const { children } = this;

    if (children) {
      R.forEach(child => {
        visitor.visit(child);
      }, children);
    }
  }

  /**
   * Used in grammars parser to exclude empty e.g. lines
   */
  isEmpty(): boolean {
    return false;
  }

  toString(): string {
    const { kind } = this;

    return R.is(String, kind) ? <any>kind : null;
  }
}

/**
 * Node withs ingle value
 */
export class ValueNode<T, K = string> extends TreeNode<K> {
  constructor(kind: K, loc: NodeLocation, readonly value: T) {
    super(kind, loc, null);
  }

  toString(): string {
    const { value } = this;

    return `${super.toString()} value=${value}`;
  }
}

/**
 * Node that has other node on left or right
 */
@walkOverFields({
  fields: ['left', 'right'],
})
export class BinaryNode<
  K = string,
  T extends TreeNode<K> = TreeNode<K>,
> extends TreeNode<K> {
  constructor(kind: K, public left: T, public right: T) {
    super(kind, left?.loc);
  }

  /**
   * Clone of tree
   */
  clone(): BinaryNode<K> {
    const { kind, left, right } = this;

    return new BinaryNode<K>(kind, left, right);
  }

  /**
   * Returns true if both left / right are empty
   */
  isEmpty(): boolean {
    const { left, right } = this;

    return !left && !right;
  }

  /**
   * Returns true if only one side is present
   */
  hasSingleSide(): boolean {
    const { left, right } = this;

    return !left !== !right;
  }

  /**
   * Returns non null first side from left
   */
  getFirstNonNullSide(): T {
    const { left, right } = this;

    return left ?? right;
  }

  /**
   * Returns first non null side of tree if has only one side
   */
  getSingleSideIfOnlyOne(): T | this {
    if (this.isEmpty()) {
      return null;
    }

    return this.hasSingleSide() ? this.getFirstNonNullSide() : this;
  }
}

/**
 * Binary node with operator
 */
export class BinaryOpNode<
  K = string,
  T extends TreeNode<K> = TreeNode<K>,
> extends BinaryNode<K, T> {
  constructor(kind: K, public op: TokenType, left: T, right: T) {
    super(kind, left, right);
  }

  /**
   * Clone of op tree
   */
  clone(): BinaryOpNode<K, T> {
    const { kind, op, left, right } = this;

    return new BinaryOpNode<K, T>(kind, op, left, right);
  }

  toString(): string {
    const { op } = this;

    return dumpAttributesToString(this.kind as any, {
      op,
    });
  }
}
