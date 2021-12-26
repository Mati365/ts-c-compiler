import {findByName, dumpCompilerAttrs} from '@compiler/core/utils';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch, CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {CType} from '../CType';
import {CPrimitiveType} from '../CPrimitiveType';
import {CFunctionSpecifierMonad} from './CFunctionSpecifierMonad';
import {CNamedTypedEntry, CStorageClassMonad} from '../parts';

export type CFunctionTypeDescriptor = {
  name?: string,
  returnType: CType,
  args: CNamedTypedEntry[],
  specifier: CFunctionSpecifierMonad,
  callConvention: CFunctionCallConvention,
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
        callConvention: CFunctionCallConvention.CDECL,
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
  get callConvention() { return this.value.callConvention; }

  override isCallable() {
    return true;
  }

  override isEqual(value: Identity<CFunctionType>): boolean {
    if (!(value instanceof CFunctionType))
      return false;

    const {
      returnType, args,
      specifier, storage,
    } = this;

    return (
      value.returnType.isEqual(returnType)
        && value.callConvention === value.callConvention
        && value.args.length === args.length
        && value.specifier.isEqual(specifier)
        && value.storage.isEqual(storage)
        && !value.args.some((arg, index) => !arg.isEqual(args[index]))
    );
  }

  override getDisplayName(): string {
    const {
      returnType, args, name,
      arch, storage, specifier,
      callConvention,
    } = this;

    const serializedArgs = (
      args
        .map((arg) => arg.getDisplayName())
        .join(', ')
    );

    const attrs = dumpCompilerAttrs(
      {
        arch,
        callConvention,
        argsSizeof: this.getArgsByteSize(),
      },
    );

    return [
      attrs,
      specifier.getDisplayName(),
      storage.getDisplayName(),
      returnType.getDisplayName(),
      name || '<anonymous>',
      `(${serializedArgs}) { ... }`,
    ].filter(Boolean).join(' ');
  }

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

  /**
   * Returns total byte size of arguments
   *
   * @return {number}
   * @memberof CFunctionType
   */
  getArgsByteSize(): number {
    return this.args.reduce((acc, arg) => acc + arg.type.getByteSize(), 0);
  }
}
