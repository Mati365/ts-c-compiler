import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/x86-nano-c/constants';
import {CType, CTypeDescriptor} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CPointerTypeDescriptor = CTypeDescriptor & {
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
  static ofType(arch: CCompilerArch, baseType: CType, qualifiers?: number) {
    return new CPointerType(
      {
        arch,
        baseType,
        qualifiers,
      },
    );
  }

  get baseType() {
    return this.value.baseType;
  }

  override isEqual(value: Identity<CPointerTypeDescriptor>): boolean {
    if (!(value instanceof CPointerType))
      return false;

    return value.baseType.isEqual(this.baseType);
  }

  override getByteSize(): number {
    return CPrimitiveType.int(this.arch).getByteSize();
  }

  override getDisplayName(): string {
    return concatNonEmptyStrings(
      [
        `(${this.baseType.getDisplayName()})*`,
        this.getQualifiersDisplayName(),
      ],
    );
  }
}
