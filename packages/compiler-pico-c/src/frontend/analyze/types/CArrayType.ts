import * as R from 'ramda';

import { concatNonEmptyStrings } from '@ts-c-compiler/core';

import { Identity } from '@ts-c-compiler/core';
import { CCompilerArch } from '#constants';
import { CType, CTypeDescriptor } from './CType';
import { CPrimitiveType } from './CPrimitiveType';

export type CArrayTypeDescriptor = CTypeDescriptor & {
  baseType: CType;
  size?: number;
};

export type CArrayFlattenDescriptor = {
  type: CType;
  dimensions: number[];
};

export function isArrayLikeType(type: CType): type is CArrayType {
  return type?.isArray();
}

/**
 * Fixed width array pointer
 */
export class CArrayType extends CType<CArrayTypeDescriptor> {
  /**
   * Creates char[str length] array
   */
  static ofStringLiteral(
    arch: CCompilerArch,
    length: number = null,
  ): CArrayType {
    return new CArrayType({
      baseType: CPrimitiveType.char(arch),
      size: length,
    });
  }

  /**
   * Constructs array of given multidimensional size and type
   */
  static ofFlattenDescriptor({
    type,
    dimensions,
    qualifiers,
  }: CArrayFlattenDescriptor & Pick<CTypeDescriptor, 'qualifiers'>): CType {
    if (!dimensions.length) {
      return type;
    }

    const rootArrayType = new CArrayType({
      qualifiers,
      baseType: type,
      size: dimensions[0],
    });

    if (dimensions.length === 1) {
      return rootArrayType;
    }

    return R.tail(dimensions).reduce(
      (array, dimension) => array.ofAppendedDimension(dimension),
      rootArrayType,
    );
  }

  constructor(descriptor: Omit<CArrayTypeDescriptor, 'arch'>) {
    super({
      ...descriptor,
      arch: descriptor.baseType.arch,
      size: descriptor.size || null,
    });
  }

  get size() {
    return this.value.size;
  }

  get baseType() {
    return this.value.baseType;
  }

  get itemScalarValuesCount() {
    return this.baseType.scalarValuesCount;
  }

  get scalarValuesCount() {
    const { scalarValuesCount } = this.baseType;

    if (this.isUnknownSize() || R.isNil(scalarValuesCount)) {
      return null;
    }

    return this.size * scalarValuesCount;
  }

  /**
   * Return unrolled multidimensional array size
   */
  getFlattenSize(): number {
    const { baseType, size } = this;
    const childSize = isArrayLikeType(baseType) ? baseType.getFlattenSize() : 1;

    if (R.isNil(size) || R.isNil(childSize)) {
      return null;
    }

    return size * childSize;
  }

  /**
   * Return array of dimensions for CArray and its root type
   */
  getFlattenInfo(): CArrayFlattenDescriptor {
    const dimensions: number[] = [];
    let currentType: CType = this;

    do {
      if (!isArrayLikeType(currentType)) {
        break;
      }

      dimensions.unshift(currentType.size);
      currentType = currentType.baseType;
    } while (true);

    return {
      type: currentType,
      dimensions,
    };
  }

  /**
   * Creates new array of given size
   */
  ofSize(size: number): CArrayType {
    return this.map(value => ({
      ...value,
      size,
    }));
  }

  /**
   * Returns array with dimensions except first
   *
   * @example
   *  int abc[1][2][3] => int abc[2][3]
   */
  ofTailDimensions(): CType {
    const { qualifiers } = this;
    const { type, dimensions } = this.getFlattenInfo();

    return CArrayType.ofFlattenDescriptor({
      dimensions: R.tail(dimensions),
      qualifiers,
      type,
    });
  }

  /**
   * Returns array with dimensions except first
   *
   * @example
   *  int abc[1][2][3] => int abc[1][2]
   */
  ofInitDimensions(): CType {
    const { qualifiers } = this;
    const { type, dimensions } = this.getFlattenInfo();

    return CArrayType.ofFlattenDescriptor({
      dimensions: R.init(dimensions),
      qualifiers,
      type,
    });
  }

  /**
   * Returns array with flipped dimensions
   *
   * @example
   *  int abc[3][2][1] => int abc[1][2][3]
   */
  ofRevertedDimensions(): CType {
    const { qualifiers } = this;
    const { type, dimensions } = this.getFlattenInfo();

    return CArrayType.ofFlattenDescriptor({
      dimensions: R.reverse(dimensions),
      qualifiers,
      type,
    });
  }

  /**
   * Transforms for example single dimension array to multiple
   * by appending new dimension to type.
   *
   * @see CTreeTypeBuilderVisitor
   */
  ofAppendedDimension(size: number): CArrayType {
    return this.map(value => ({
      ...value,
      size,
      baseType: this,
    }));
  }

  ofPrependedDimension(size: number): CArrayType {
    const { qualifiers } = this;
    const { type, dimensions } = this.getFlattenInfo();

    return <CArrayType>CArrayType.ofFlattenDescriptor({
      dimensions: [size, ...dimensions],
      qualifiers,
      type,
    });
  }

  isUnknownSize() {
    return R.isNil(this.size);
  }

  override getSourceType() {
    return this.getFlattenInfo().type;
  }

  override isArray() {
    return true;
  }

  override isEqual(value: Identity<CArrayTypeDescriptor>) {
    if (!(value instanceof CArrayType)) {
      return false;
    }

    return value.baseType.isEqual(this.baseType) && value.size === this.size;
  }

  override getByteSize(): number {
    const { baseType, size } = this;

    return baseType.getByteSize() * (size ?? 1);
  }

  override getDisplayName(): string {
    const { baseType, size } = this;

    return concatNonEmptyStrings([
      this.getQualifiersDisplayName(),
      `${baseType.getDisplayName()}[${size ?? ''}]`,
    ]);
  }

  override getShortestDisplayName(): string {
    const { baseType, size } = this;

    return concatNonEmptyStrings([
      this.getQualifiersDisplayName(),
      `${baseType.getShortestDisplayName()}[${size ?? ''}]`,
    ]);
  }
}
