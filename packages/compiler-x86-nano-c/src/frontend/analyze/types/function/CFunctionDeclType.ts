import {findByName, dumpCompilerAttrs} from '@compiler/core/utils';

import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {Identity} from '@compiler/core/monads';
import {ASTCCompilerNode} from '@compiler/x86-nano-c/frontend';

import {CType} from '../CType';
import {CFunctionSpecifierMonad} from './CFunctionSpecifierMonad';
import {CStorageClassMonad} from './CFunctionStorageClassMonad';
import {CVariable} from '../../scope/variables/CVariable';
import {CTypeDescriptor} from '../CType';

export type CFunctionDescriptor = CTypeDescriptor & {
  name?: string,
  returnType: CType,
  args: CVariable[],
  specifier: CFunctionSpecifierMonad,
  callConvention: CFunctionCallConvention,
  storage: CStorageClassMonad,
  definition?: ASTCCompilerNode,
};

/**
 * Function and argument types
 *
 * @export
 * @class CFunctionDeclType
 * @extends {CType<CFunctionDescriptor>}
 */
export class CFunctionDeclType extends CType<CFunctionDescriptor> {
  get returnType() { return this.value.returnType; }
  get specifier() { return this.value.specifier; }
  get storage() { return this.value.storage; }
  get name() { return this.value.name; }
  get args() { return this.value.args; }
  get callConvention() { return this.value.callConvention; }
  get definition() { return this.value.definition; }

  hasDefinition() { return !!this.definition; }
  override isFunction() { return true; }

  /**
   * Compares two function declarations
   *
   * @memberof CFunctionDeclType
   */
  override isEqual(value: Identity<CFunctionDescriptor>): boolean {
    if (!(value instanceof CFunctionDeclType))
      return false;

    const {
      returnType, storage, specifier,
      callConvention, args,
    } = this;

    if (!value.returnType?.isEqual(returnType)
        || !value.storage?.isEqual(storage)
        || !value.specifier?.isEqual(specifier)
        || value.callConvention !== callConvention
        || value.args?.length !== args.length)
      return false;

    return !args.some((arg, index) => !value.args[index].isEqual(arg));
  }

  /**
   * Serializes function to string
   *
   * @memberof CFunctionDeclType
   */
  override getDisplayName(): string {
    const {
      returnType, args, name,
      storage, specifier,
      callConvention,
    } = this;

    const serializedArgs = (
      args
        .map((arg) => arg.getDisplayName())
        .join(', ')
    );

    const attrs = dumpCompilerAttrs(
      {
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
   * @param {string} name
   * @return {CVariable}
   * @memberof CFunctionDeclType
   */
  getArgByName(name: string): CVariable {
    const {args} = this;

    return findByName(name)(args);
  }

  /**
   * Returns total byte size of arguments
   *
   * @return {number}
   * @memberof CFunctionDeclType
   */
  getArgsByteSize(): number {
    return this.args.reduce((acc, arg) => acc + arg.type.getByteSize(), 0);
  }
}
