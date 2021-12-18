import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/x86-nano-c/constants';
import {CType} from './CType';

export type CArrayTypeDescriptor = {
  baseType: CType,
  size: number,
};

/**
 * Fixed width array pointer
 *
 * @export
 * @class CArrayType
 * @extends {CType<CArrayTypeDescriptor>}
 */
export class CArrayType extends CType<CArrayTypeDescriptor> {
  get size() {
    return this.value.size;
  }

  get baseType() {
    return this.value.baseType;
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

  getByteSize(arch: CCompilerArch): number {
    const {baseType, size} = this;

    return baseType.getByteSize(arch) * size;
  }

  getDisplayName(): string {
    const {baseType, size} = this;

    return concatNonEmptyStrings(
      [
        this.getQualifiersDisplayName(),
        `${baseType.getDisplayName()}[${size}]`,
      ],
    );
  }
}
