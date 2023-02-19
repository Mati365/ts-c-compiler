import * as R from 'ramda';

import {
  AbstractTreeVisitor,
  IsWalkableNode,
} from '@compiler/grammar/tree/AbstractTreeVisitor';

import { isArrayLikeType, isStructLikeType } from '../../types';
import { ASTCCompilerNode } from '../../../parser/ast/ASTCCompilerNode';
import { CType } from '../../types/CType';

export type CVariableInitializeValue =
  | string
  | number
  | CVariableInitializerTree
  | ASTCCompilerNode;
export type CVariableInitializerFields = CVariableInitializeValue[];

export function isConstantVariableInitializer(value: CVariableInitializeValue) {
  if (!value) {
    return true;
  }

  const type = typeof value;
  return type === 'string' || type === 'number';
}

export function isInitializerTreeValue(
  value: CVariableInitializeValue,
): value is CVariableInitializerTree {
  return R.is(Object, value) && R.has('_baseType', value);
}

type CVariableStringInitializerAttrs<C> = {
  baseType: CType;
  parentAST: C;
  text: string;
};

/**
 * Recursive map structure of type initializer
 */
export class CVariableInitializerTree<
  C extends ASTCCompilerNode = ASTCCompilerNode,
> implements IsWalkableNode
{
  constructor(
    protected readonly _baseType: CType,
    protected readonly _parentAST: C,
    protected _fields: CVariableInitializerFields = null,
  ) {
    if (!_fields) {
      this.fill(null);
    }
  }

  get parentAST() {
    return this._parentAST;
  }

  get baseType() {
    return this._baseType;
  }

  get fields() {
    return this._fields;
  }

  static ofStringLiteral<C extends ASTCCompilerNode>({
    baseType,
    parentAST,
    text,
  }: CVariableStringInitializerAttrs<C>) {
    const fields: CVariableInitializerFields = [];

    for (let i = 0; i < text.length; ++i) {
      fields[i] = text.charCodeAt(i);
    }

    fields[text.length] = 0x0;

    return new CVariableInitializerTree(baseType, parentAST, fields);
  }

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
   */
  getInitializedFieldsCount(): number {
    const { fields } = this;
    let i = 0;

    for (; i < fields.length; ++i) {
      if (fields[i] === null) {
        break;
      }
    }

    return i;
  }

  /**
   * Expands fields array to given size
   */
  ensureSize(size: number) {
    const { fields } = this;
    const delta = size - fields.length;

    for (let i = 0; i < delta; ++i) {
      fields.push(null);
    }
  }

  /**
   * Sets values on given offset and if offset is bigger than array fills with null
   */
  setAndExpand(offset: number, value: CVariableInitializeValue) {
    const { fields } = this;

    this.ensureSize(offset);
    fields[offset] = value;
  }

  /**
   * Used to return value for non-array type initializers
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
   */
  getFixedSizeBaseType(): CType {
    const { baseType, fields } = this;

    if (isArrayLikeType(baseType) && baseType.isUnknownSize()) {
      return baseType.ofSize(
        Math.ceil(fields.length / baseType.baseType.scalarValuesCount),
      );
    }

    return baseType;
  }

  /**
   * Returns type at specified offset
   */
  getIndexExpectedType(offset: number): CType {
    const { baseType } = this;

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
   */
  getNestedInitializerGroupType(): CType {
    const { baseType } = this;

    return isArrayLikeType(baseType) ? baseType.ofTailDimensions() : baseType;
  }

  /**
   * Return maximum count of items for given base type
   *
   * @see
   *  Returns null if unknown size!
   *
   * @example
   *  int abc[3][4] => 12
   */
  get scalarValuesCount(): number {
    return this.baseType.scalarValuesCount;
  }
}
