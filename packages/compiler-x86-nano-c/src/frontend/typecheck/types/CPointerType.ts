import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/x86-nano-c/constants';
import {CType} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CPointerTypeDescriptor = {
  baseType: CType,
};

/**
 * Pointer C-type (16 bit address offset)
 *
 * @export
 * @class CPointerType
 * @extends {CType<CPointerTypeDescriptor>}
 */
export class CPointerType extends CType<CPointerTypeDescriptor> {
  get baseType() {
    return this.value.baseType;
  }

  isEqual(value: Identity<CPointerTypeDescriptor>): boolean {
    if (!(value instanceof CPointerType))
      return false;

    return value.baseType.isEqual(this.baseType);
  }

  getByteSize(arch: CCompilerArch): number {
    return CPrimitiveType.int.getByteSize(arch);
  }

  getDisplayName(): string {
    return concatNonEmptyStrings(
      [
        this.getQualifiersDisplayName(),
        `*(${this.baseType.getDisplayName()})`,
      ],
    );
  }
}
