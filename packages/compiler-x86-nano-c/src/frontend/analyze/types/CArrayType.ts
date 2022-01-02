import * as R from 'ramda';
import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CType} from './CType';

export type CArrayTypeDescriptor = {
  baseType: CType,
  size?: number,
};

/**
 * Fixed width array pointer
 *
 * @export
 * @class CArrayType
 * @extends {CType<CArrayTypeDescriptor>}
 */
export class CArrayType extends CType<CArrayTypeDescriptor> {
  constructor(descriptor: Omit<CArrayTypeDescriptor, 'arch'>) {
    super(
      {
        ...descriptor,
        arch: descriptor.baseType.arch,
      },
    );
  }

  get size() { return this.value.size; }
  get baseType() { return this.value.baseType; }

  /**
   * Creates new array of given size
   *
   * @param {number} size
   * @return {CArrayType}
   * @memberof CArrayType
   */
  ofSize(size: number): CArrayType {
    return this.map((value) => ({
      ...value,
      size,
    }));
  }

  /**
   * Transforms for example single dimension array to multiple
   * by appending new dimension to type.
   *
   * @see CTreeTypeBuilderVisitor
   *
   * @param {number} size
   * @return {CArrayType}
   * @memberof CArrayType
   */
  ofAppendedDimension(size: number): CArrayType {
    return this.map((value) => ({
      ...value,
      size,
      baseType: this,
    }));
  }

  isUnknownSize() {
    return R.isNil(this.size);
  }

  override isIndexable() {
    return true;
  }

  override isEqual(value: Identity<CArrayTypeDescriptor>) {
    if (!(value instanceof CArrayType))
      return false;

    return (
      value.baseType.isEqual(this.baseType)
        && value.size === this.size
    );
  }

  override getByteSize(): number {
    const {baseType, size} = this;

    return baseType.getByteSize() * (size ?? 1);
  }

  override getDisplayName(): string {
    const {baseType, size} = this;

    return concatNonEmptyStrings(
      [
        this.getQualifiersDisplayName(),
        `${baseType.getDisplayName()}[${size ?? ''}]`,
      ],
    );
  }
}
