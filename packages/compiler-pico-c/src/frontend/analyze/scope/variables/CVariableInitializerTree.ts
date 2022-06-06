import * as R from 'ramda';

import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';

import {isArrayLikeType, isStructLikeType} from '../../types';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {CType} from '../../types/CType';

export type CVariableInitializeValue = string | number | CVariableInitializerTree | ASTCCompilerNode;
export type CVariableInitializerFields = CVariableInitializeValue[];

export function isConstantVariableInitializer(value: CVariableInitializeValue) {
  if (!value)
    return true;

  const type = typeof value;
  return type === 'string' || type === 'number';
}

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

  hasOnlyConstantExpressions() {
    return this._fields.every(isConstantVariableInitializer);
  }

  /**
   * Returns total count of non null (initialized) fields
   *
   * @return {number}
   * @memberof CVariableInitializerTree
   */
  getInitializedFieldsCount(): number {
    const {fields} = this;

    for (let i = 0; i < fields.length; ++i) {
      if (fields[i] === null)
        return i;
    }

    return 0;
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
   * Returns type that always has fixed size
   *
   * @example
   *  int a[] = { 1, 2, 3 }
   *  => int[3]
   *
   * @return {CType}
   * @memberof CVariableInitializerTree
   */
  getFixedSizeBaseType(): CType {
    const {baseType, fields} = this;

    if (isArrayLikeType(baseType) && baseType.isUnknownSize()) {
      return baseType.ofSize(
        Math.ceil(fields.length / baseType.baseType.scalarValuesCount),
      );
    }

    return baseType;
  }

  /**
   * Returns type at specified offset
   *
   * @param {number} offset
   * @return {CType}
   * @memberof CVariableInitializerTree
   */
  getIndexExpectedType(offset: number): CType {
    const {baseType} = this;

    if (isStructLikeType(baseType)) {
      return baseType.getFieldTypeByIndex(
        offset % baseType.getFlattenFieldsCount(),
      );
    }

    if (isArrayLikeType(baseType)) {
      const baseArrayType = baseType.getSourceType();

      if (isStructLikeType(baseArrayType)) {
        return baseArrayType.getFieldTypeByIndex(
          offset % baseArrayType.getFlattenFieldsCount(),
        );
      }

      return baseArrayType;
    }

    return this.getNestedInitializerGroupType();
  }

  /**
   * Returns type of nested group
   *
   * @example
   *  int a[2][] = { { 1 } }
   *                   ^
   *              Array<int, 2>
   *
   * @private
   * @return {CType}
   * @memberof CVariableInitializerTree
   */
  getNestedInitializerGroupType(): CType {
    const {baseType} = this;

    return (
      isArrayLikeType(baseType)
        ? baseType.ofTailDimensions()
        : baseType
    );
  }

  /**
   * Return maximum count of items for given base type
   *
   * @see
   *  Returns null if unknown size!
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
