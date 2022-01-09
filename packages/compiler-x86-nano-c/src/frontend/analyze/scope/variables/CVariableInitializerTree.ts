import * as R from 'ramda';

import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {CType} from '../../types/CType';

import {isArrayLikeType} from '../../types';

export type CInitializerMapKey = number | string;
export type CVariableInitializeValue = string | number | CVariableInitializerTree;
export type CVariableInitializerMap = Map<CInitializerMapKey, CVariableInitializeValue>;

export function isInitializerTreeValue(value: CVariableInitializeValue): value is CVariableInitializerTree {
  return R.is(Object, value) && R.has('_baseType', value);
}

/**
 * Recursive map structure of type initializer
 *
 * @export
 * @class CVariableInitializerTree
 * @implements {IsWalkableNode}
 * @template C
 */
export class CVariableInitializerTree<C extends ASTCCompilerNode = ASTCCompilerNode> implements IsWalkableNode {
  constructor(
    protected readonly _baseType: CType,
    protected readonly _parentAST: C,
    protected readonly _fields: CVariableInitializerMap = new Map,
  ) {}

  get parentAST() { return this._parentAST; }
  get baseType() { return this._baseType; }
  get fields() { return this._fields; }

  walk(visitor: AbstractTreeVisitor<any>): void {
    for (const [, value] of this.fields)
      visitor.visit(value);
  }

  /**
   * Return maximum count of items for given base type
   *
   * @example
   *  int abc[3][4] => 12
   *
   * @return {number}
   * @memberof CVariableInitializerTree
   */
  getMaximumFlattenItemsCount(): number {
    const {baseType} = this;

    if (isArrayLikeType(baseType))
      return baseType.getFlattenSize();

    if (baseType.isPointer())
      return null;

    return 1;
  }

  /**
   * Get total fields count filled by nested types
   *
   * @return {number}
   * @memberof CVariableInitializerTree
   */
  getCurrentTypeFlattenSize(): number {
    const {fields} = this;
    let size: number = 0;

    for (const [, value] of fields) {
      if (isInitializerTreeValue(value))
        size += value.getMaximumFlattenItemsCount();
      else
        size++;
    }

    return size;
  }
}
