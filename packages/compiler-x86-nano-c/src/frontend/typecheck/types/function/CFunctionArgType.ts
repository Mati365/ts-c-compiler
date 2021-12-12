import {Identity} from '@compiler/core/monads';
import {CType} from '../CType';

export type CFunctionArgTypeDescriptor = {
  type: CType,
  name?: string,
};

/**
 * Function arg that can contain name
 *
 * @export
 * @class CFunctionArgType
 * @extends {CType<CFunctionArgTypeDescriptor>}
 */
export class CFunctionArgType extends CType<CFunctionArgTypeDescriptor> {
  get name() {
    return this.value.name;
  }

  get type() {
    return this.value.type;
  }

  isCallable(): boolean {
    return true;
  }

  isEqual(value: Identity<CFunctionArgTypeDescriptor>): boolean {
    if (!(value instanceof CFunctionArgType))
      return false;

    return this.type.isEqual(value.type);
  }

  getByteSize(): number {
    return null;
  }

  getDisplayName(): string {
    const {type, name} = this;

    return `${type.getDisplayName()} ${name || ''}`.trim();
  }
}
