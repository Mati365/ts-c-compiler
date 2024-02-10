import { withBuiltinPrefix } from 'builtins/utils';

import { CVariable } from 'frontend/analyze/scope/variables/CVariable';
import { CPointerType, CTypeDescriptor, CUnknownType } from 'frontend/analyze/types';

import { CVaListBuiltinStruct } from './VaList.builtin';
import { CBuiltinFnDeclType } from 'builtins/CBuiltinFnDeclType';

/**
 * void va_start( va_list ap, parmN );
 */
export class CVaStartBuiltinFn extends CBuiltinFnDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      name: withBuiltinPrefix('va_start'),
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
          name: 'precedingParam',
          type: new CUnknownType({
            arch: descriptor.arch,
          }),
        }),
      ],
    });
  }
}
