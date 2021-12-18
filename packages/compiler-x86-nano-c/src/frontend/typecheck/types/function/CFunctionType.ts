import {findByName} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CType} from '../CType';
import {CPrimitiveType} from '../CPrimitiveType';
import {CFunctionArgType} from './CFunctionArgType';

export type CFunctionTypeDescriptor = {
  returnType: CType,
  args: CFunctionArgType[],
};

/**
 * Function pointer
 *
 * @export
 * @class CFunctionType
 * @extends {CType<CFunctionTypeDescriptor>}
 */
export class CFunctionType extends CType<CFunctionTypeDescriptor> {
  static ofBlank() {
    return new CFunctionType(
      {
        returnType: CPrimitiveType.void,
        args: [],
      },
    );
  }

  get returnType() { return this.value.returnType; }
  get args() { return this.value.args; }

  isCallable(): boolean {
    return true;
  }

  isEqual(value: Identity<CFunctionType>): boolean {
    if (!(value instanceof CFunctionType))
      return false;

    const {returnType, args} = this;
    return (
      value.returnType.isEqual(returnType)
        && value.args.length === args.length
        && !value.args.some((arg, index) => !arg.isEqual(args[index]))
    );
  }

  getByteSize(): number {
    return null;
  }

  getDisplayName(): string {
    const {returnType, args} = this;
    const serializedArgs = args.map((arg) => arg.getDisplayName()).join(', ');

    return `(${serializedArgs}) -> ${returnType.getDisplayName()}`;
  }

  /**
   * Lookups in array and returns arg by name
   *
   * @see
   *  It is list search not hash! It is kinda slow!
   *
   * @param {string} name
   * @return {CFunctionArgType}
   * @memberof CFunctionType
   */
  getArgByName(name: string): CFunctionArgType {
    const {args} = this;

    return findByName(name)(args);
  }
}
