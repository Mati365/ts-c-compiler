import {Identity} from '@compiler/core/monads';
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

  getByteSize(): number {
    return CPrimitiveType.int.getByteSize();
  }

  getDisplayName(): string {
    return `*(${this.baseType.getDisplayName()})`;
  }
}
