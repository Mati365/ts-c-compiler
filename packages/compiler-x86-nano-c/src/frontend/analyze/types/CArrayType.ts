import * as R from 'ramda';
import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CType, CTypeDescriptor} from './CType';

export type CArrayTypeDescriptor = CTypeDescriptor & {
  baseType: CType,
  size?: number,
};

export function isArrayLikeType(type: CType): type is CArrayType {
  return type?.isArray();
}

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
   * Return unrolled multidimensional array size
   *
   * @return {number}
   * @memberof CArrayType
   */
  getFlattenSize(): number {
    const {baseType} = this;

    return this.size * (
      isArrayLikeType(baseType)
        ? baseType.size
        : 1
    );
  }

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

  override isArray() { return true; }

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
