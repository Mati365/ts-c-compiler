import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/pico-c/constants';
import {CType, CTypeDescriptor} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CPointerTypeDescriptor = CTypeDescriptor & {
  baseType: CType,
};

export function isPointerLikeType(type: CType): type is CPointerType {
  return type?.isPointer?.();
}

/**
 * Pointer C-type (16 bit address offset)
 *
 * @export
 * @class CPointerType
 * @extends {CType<CPointerTypeDescriptor>}
 */
export class CPointerType extends CType<CPointerTypeDescriptor> {
  /**
   * Creates const char*
   *
   * @static
   * @param {CCompilerArch} arch
   * @return {CPointerType}
   * @memberof CPointerType
   */
  static ofStringLiteral(arch: CCompilerArch): CPointerType {
    return CPointerType.ofType(
      arch,
      CPrimitiveType
        .char(arch)
        .ofConst(),
    );
  }

  /**
   * Creates pointer of base type
   *
   * @static
   * @param {CCompilerArch} arch
   * @param {CType} baseType
   * @param {number} [qualifiers]
   * @return {CPointerType}
   * @memberof CPointerType
   */
  static ofType(arch: CCompilerArch, baseType: CType, qualifiers?: number): CPointerType {
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

  override isScalar() { return true; }
  override isPointer() { return true; }

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
        `${this.baseType.getDisplayName()}*`,
        this.getQualifiersDisplayName(),
      ],
    );
  }
}
