import * as R from 'ramda';

import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {CType} from '../../types/CType';

export type CVariableInitializeValue = string | number | CVariableInitializerTree;
export type CVariableInitializerMap = Map<number, CVariableInitializeValue>;

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
  ) {
    this.fill(null);
  }

  get parentAST() { return this._parentAST; }
  get baseType() { return this._baseType; }
  get fields() { return this._fields; }

  fill(value: CVariableInitializeValue) {
    const {fields} = this;

    fields.clear();
    for (let i = 0; i < this.scalarValuesCount; ++i)
      fields.set(i, value);
  }

  walk(visitor: AbstractTreeVisitor<any>): void {
    for (const [, value] of this.fields)
      visitor.visit(value);
  }

  /**
   * Used to return value for non-array type initializers
   *
   * @return {CVariableInitializeValue}
   * @memberof CVariableInitializerTree
   */
  getFirstValue(): CVariableInitializeValue {
    return this._fields.get(0);
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
  get scalarValuesCount(): number {
    return this.baseType.scalarValuesCount;
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
        size += value.scalarValuesCount;
      else
        size++;
    }

    return size;
  }
}
