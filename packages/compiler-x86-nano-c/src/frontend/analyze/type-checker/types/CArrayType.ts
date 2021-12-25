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
   *
   * @param {number} size
   * @return {CArrayType}
   * @memberof CArrayType
   */
  ofPrependedDimension(size: number): CArrayType {
    return this.map((value) => ({
      ...value,
      baseType: this.ofSize(size),
    }));
  }

  isUnknownSize() {
    return R.isNil(this.size);
  }

  isIndexable(): boolean {
    return true;
  }

  isEqual(value: Identity<CArrayTypeDescriptor>): boolean {
    if (!(value instanceof CArrayType))
      return false;

    return (
      value.baseType.isEqual(this.baseType)
        && value.size === this.size
    );
  }

  getByteSize(): number {
    const {baseType, size} = this;

    return baseType.getByteSize() * (size ?? 1);
  }

  getDisplayName(): string {
    const {baseType, size} = this;

    return concatNonEmptyStrings(
      [
        this.getQualifiersDisplayName(),
        `${baseType.getDisplayName()}[${size ?? ''}]`,
      ],
    );
  }
}
