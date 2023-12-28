import { withBuiltinPrefix } from 'builtins/utils';

import { isIRConstant } from 'frontend/ir/variables/IRConstant';
import type { IRInstructionTypedArg } from 'frontend/ir/variables';

import { CVariable } from 'frontend/analyze/scope/variables/CVariable';
import {
  CPointerType,
  CPrimitiveType,
  CTypeDescriptor,
  CUnknownType,
} from 'frontend/analyze/types';

import { CVaListBuiltinStruct } from './VaList.builtin';
import { CBuiltinFnDeclType } from 'builtins/CBuiltinFnDeclType';

/**
 * void va_arg( va_list ap, int size );
 */
export class CVaArgBuiltinFn extends CBuiltinFnDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      name: withBuiltinPrefix('va_arg'),
      returnType: new CUnknownType({
        arch: descriptor.arch,
      }),
      args: [
        new CVariable({
          name: 'ap',
          type: CPointerType.ofType(
            new CVaListBuiltinStruct({
              arch: descriptor.arch,
            }),
          ),
        }),

        new CVariable({
          name: 'size',
          type: CPrimitiveType.int(descriptor.arch),
        }),
      ],
    });
  }

  getAllocOutputBufferSize([, sizeArg]: IRInstructionTypedArg[]) {
    if (!isIRConstant(sizeArg)) {
      return 0;
    }

    return sizeArg.constant;
  }
}
