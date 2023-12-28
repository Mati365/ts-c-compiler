import { CFunctionCallConvention } from '#constants';
import {
  CFunctionDeclType,
  CFunctionDescriptor,
  CFunctionSpecifierMonad,
  CPrimitiveType,
  CStorageClassMonad,
  CType,
} from 'frontend/analyze/types';

import type { IRInstructionTypedArg } from 'frontend/ir/variables';

type CBuiltinFnDescriptor = Pick<
  CFunctionDescriptor,
  'arch' | 'args' | 'name' | 'noIREmit'
> & {
  returnType?: CType;
};

export const isBuiltinFnDeclType = (type: any): type is CBuiltinFnDeclType =>
  'getAllocOutputBufferSize' in type;

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

  getAllocOutputBufferSize(_: IRInstructionTypedArg[]): number {
    return 0;
  }

  getAllocOutputRegVarType(_: IRInstructionTypedArg[]): CType | null {
    return null;
  }
}
