import { withBuiltinPrefix } from 'builtins/utils';

import { CVariable } from 'frontend/analyze/scope/variables/CVariable';
import { CPointerType, CTypeDescriptor } from 'frontend/analyze/types';

import { CVaListBuiltinStruct } from './VaList.builtin';
import { CBuiltinFnDeclType } from 'builtins/CBuiltinFnDeclType';

/**
 * void va_end( va_list ap );
 */
export class CVaEndBuiltinFn extends CBuiltinFnDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      noIREmit: true,
      name: withBuiltinPrefix('va_end'),
      args: [
        new CVariable({
          name: 'ap',
          type: CPointerType.ofType(
            new CVaListBuiltinStruct({
              arch: descriptor.arch,
            }),
          ),
        }),
      ],
    });
  }

  getAllocOutputVarSize() {
    return 0;
  }
}
