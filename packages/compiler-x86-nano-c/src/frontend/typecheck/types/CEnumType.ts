import {CPrimitiveType} from './CPrimitiveType';
import {CType} from './CType';

export type CEnumDescriptor = {
  name?: string,
  fields: Map<string, number>,
};

/**
 * Defines C-like enum with ints
 *
 * @todo
 *  Add more fields like in struct!
 *
 * @export
 * @class CEnumType
 * @extends {CType<CStructTypeDescriptor>}
 */
export class CEnumType extends CType<CEnumDescriptor> {
  getDisplayName(): string {
    throw new Error('Method not implemented.');
  }

  getByteSize(): number {
    return CPrimitiveType.int(this.arch).getByteSize();
  }
}
