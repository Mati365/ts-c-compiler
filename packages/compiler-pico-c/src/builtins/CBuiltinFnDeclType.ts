import { CFunctionCallConvention } from '#constants';
import {
  CFunctionDeclType,
  CFunctionDescriptor,
  CFunctionSpecifierMonad,
  CPrimitiveType,
  CStorageClassMonad,
} from 'frontend/analyze/types';

import type { IRInstructionTypedArg } from 'frontend/ir/variables';

type CBuiltinFnDescriptor = Pick<
  CFunctionDescriptor,
  'arch' | 'args' | 'name' | 'noIREmit'
>;

export const isBuiltinFnDeclType = (type: any): type is CBuiltinFnDeclType =>
  'getAllocOutputVarSize' in type;

export abstract class CBuiltinFnDeclType extends CFunctionDeclType {
  constructor(descriptor: CBuiltinFnDescriptor) {
    super({
      returnType: CPrimitiveType.void(descriptor.arch),
      specifier: CFunctionSpecifierMonad.ofBlank(),
      storage: CStorageClassMonad.ofBlank(),
      callConvention: CFunctionCallConvention.STDCALL,
      ...descriptor,
    });
  }

  abstract getAllocOutputVarSize(callArgs: IRInstructionTypedArg[]): number;
}
