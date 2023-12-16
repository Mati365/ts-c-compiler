import { CFunctionCallConvention } from '#constants';
import { CVariable } from 'frontend/analyze/scope/variables/CVariable';
import {
  CFunctionDeclType,
  CFunctionSpecifierMonad,
  CPrimitiveType,
  CStorageClassMonad,
  CTypeDescriptor,
  CUnknownType,
} from 'frontend/analyze/types';

import { CVaListBuiltinStruct } from './VaList.builtin';

/**
 * void va_start( va_list ap, parmN );
 */
export class CVaStartBuiltinFn extends CFunctionDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      returnType: CPrimitiveType.void(descriptor.arch),
      specifier: CFunctionSpecifierMonad.ofBlank(),
      storage: CStorageClassMonad.ofBlank(),
      callConvention: CFunctionCallConvention.STDCALL,
      args: [
        new CVariable({
          name: 'ap',
          type: new CVaListBuiltinStruct({
            arch: descriptor.arch,
          }),
        }),

        new CVariable({
          name: 'precedingParam',
          type: new CUnknownType({
            arch: descriptor.arch,
          }),
        }),
      ],
    });
  }
}
