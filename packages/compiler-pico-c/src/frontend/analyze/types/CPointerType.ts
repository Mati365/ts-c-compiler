import {concatNonEmptyStrings} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/pico-c/constants';

import {CArrayType, isArrayLikeType} from './CArrayType';
import {CType, CTypeDescriptor} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CPointerTypeDescriptor = CTypeDescriptor & {
  baseType: CType,
};

export function isPointerLikeType(type: CType): type is CPointerType {
  return type?.isPointer?.();
}

export function isPointerArithmeticType(type: CType): boolean {
  return isPointerLikeType(type) || isArrayLikeType(type);
}

/**
 * Pointer C-type (16 bit address offset)
 *
 * @export
 * @class CPointerType
 * @extends {CType<CPointerTypeDescriptor>}
 */
export class CPointerType extends CType<CPointerTypeDescriptor> {
  constructor(attrs: Omit<CPointerTypeDescriptor, 'arch'>) {
    super(
      {
        ...attrs,
        arch: attrs.baseType.arch,
      },
    );
  }

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
  static ofType(baseType: CType, qualifiers?: number): CPointerType {
    return new CPointerType(
      {
        baseType,
        qualifiers,
      },
    );
  }

  static ofArray(array: CArrayType): CPointerType {
    return CPointerType.ofType(array.getSourceType());
  }

  get baseType() {
    return this.value.baseType;
  }

  override getSourceType() {
    const {baseType} = this;

    if (isArrayLikeType(baseType))
      return baseType.getSourceType();

    if (isPointerLikeType(baseType))
      return baseType.getSourceType();

    return baseType;
  }

  override isScalar() { return true; }
  override isPointer() { return true; }

  override isEqual(value: Identity<CPointerTypeDescriptor>): boolean {
    if (!(value instanceof CPointerType))
      return false;

    return value.baseType.isEqual(this.baseType);
  }

  override getByteSize(): number {
    return CPrimitiveType.address(this.arch).getByteSize();
  }

  override getDisplayName(): string {
    return concatNonEmptyStrings(
      [
        `${this.baseType.getShortestDisplayName()}*`,
        this.getQualifiersDisplayName(),
      ],
    );
  }
}
