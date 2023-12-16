import { CFunctionCallConvention } from '#constants';
import {
  CFunctionDeclType,
  CFunctionSpecifierMonad,
  CPrimitiveType,
  CStorageClassMonad,
  CTypeDescriptor,
} from 'frontend/analyze/types';

export class CVaStartBuiltinFn extends CFunctionDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      returnType: CPrimitiveType.void(descriptor.arch),
      specifier: CFunctionSpecifierMonad.ofBlank(),
      storage: CStorageClassMonad.ofBlank(),
      callConvention: CFunctionCallConvention.STDCALL,
      args: [],
    });
  }
}
