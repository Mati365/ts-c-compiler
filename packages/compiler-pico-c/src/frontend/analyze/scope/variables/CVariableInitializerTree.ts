import * as R from 'ramda';

import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {CType} from '../../types/CType';

export type CVariableInitializeValue = string | number | CVariableInitializerTree | ASTCCompilerNode;
export type CVariableInitializerFields = CVariableInitializeValue[];

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
    protected _fields: CVariableInitializerFields = [],
  ) {
    this.fill(null);
  }

  get parentAST() { return this._parentAST; }
  get baseType() { return this._baseType; }
  get fields() { return this._fields; }

  fill(value: CVariableInitializeValue) {
    this._fields = new Array(this.scalarValuesCount).fill(value);
  }

  walk(visitor: AbstractTreeVisitor<any>): void {
    this._fields.forEach(visitor.visit.bind(visitor));
  }

  /**
   * Expands fields array to given size
   *
   * @param {number} size
   * @memberof CVariableInitializerTree
   */
  ensureSize(size: number) {
    const {fields} = this;
    const delta = size - fields.length;

    for (let i = 0; i < delta; ++i) {
      fields.push(null);
    }
  }

  /**
   * Sets values on given offset and if offset is bigger than array fills with null
   *
   * @param {number} offset
   * @param {CVariableInitializeValue} value
   * @memberof CVariableInitializerTree
   */
  setAndExpand(offset: number, value: CVariableInitializeValue) {
    const {fields} = this;

    this.ensureSize(offset);
    fields[offset] = value;
  }

  /**
   * Used to return value for non-array type initializers
   *
   * @return {CVariableInitializeValue}
   * @memberof CVariableInitializerTree
   */
  getFirstValue(): CVariableInitializeValue {
    return this._fields[0];
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
}
