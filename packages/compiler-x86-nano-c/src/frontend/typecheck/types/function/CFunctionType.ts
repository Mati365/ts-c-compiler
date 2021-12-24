import {findByName} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/x86-nano-c/constants';
import {CType} from '../CType';
import {CPrimitiveType} from '../CPrimitiveType';
import {CFunctionSpecifierMonad} from './CFunctionSpecifierMonad';
import {CNamedTypedEntry, CStorageClassMonad} from '../parts';

export type CFunctionTypeDescriptor = {
  name?: string,
  returnType: CType,
  args: CNamedTypedEntry[],
  specifier: CFunctionSpecifierMonad,
  storage: CStorageClassMonad,
};

/**
 * Function pointer
 *
 * @export
 * @class CFunctionType
 * @extends {CType<CFunctionTypeDescriptor>}
 */
export class CFunctionType extends CType<CFunctionTypeDescriptor> {
  static ofBlank(arch: CCompilerArch) {
    return new CFunctionType(
      {
        returnType: CPrimitiveType.void(arch),
        specifier: CFunctionSpecifierMonad.ofBlank(),
        storage: CStorageClassMonad.ofBlank(),
        args: [],
      },
    );
  }

  constructor(descriptor: Omit<CFunctionTypeDescriptor, 'arch'>) {
    super(
      {
        ...descriptor,
        arch: descriptor.returnType.arch,
      },
    );
  }

  get returnType() { return this.value.returnType; }
  get specifier() { return this.value.specifier; }
  get storage() { return this.value.storage; }
  get name() { return this.value.name; }
  get args() { return this.value.args; }

  /**
   * Lookups in array and returns arg by name
   *
   * @see
   *  It is list search not hash! It is kinda slow!
   *
   * @param {string} name
   * @return {CNamedTypedEntry}
   * @memberof CFunctionType
   */
  getArgByName(name: string): CNamedTypedEntry {
    const {args} = this;

    return findByName(name)(args);
  }

  isCallable(): boolean {
    return true;
  }

  isEqual(value: Identity<CFunctionType>): boolean {
    if (!(value instanceof CFunctionType))
      return false;

    const {
      returnType, args,
      specifier, storage,
    } = this;

    return (
      value.returnType.isEqual(returnType)
        && value.args.length === args.length
        && value.specifier.isEqual(specifier)
        && value.storage.isEqual(storage)
        && !value.args.some((arg, index) => !arg.isEqual(args[index]))
    );
  }

  getByteSize(): number {
    return null;
  }

  getDisplayName(): string {
    const {
      returnType, args, name,
      storage, specifier,
    } = this;

    const serializedArgs = (
      args
        .map((arg) => arg.getDisplayName())
        .join(', ')
    );

    return [
      specifier.getDisplayName(),
      storage.getDisplayName(),
      returnType.getDisplayName(),
      name || '<anonymous>',
      `(${serializedArgs}) { ... }`,
    ].filter(Boolean).join(' ');
  }
}
