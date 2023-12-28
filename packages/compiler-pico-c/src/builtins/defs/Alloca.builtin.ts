import { withBuiltinPrefix } from 'builtins/utils';

import { CVariable } from 'frontend/analyze/scope/variables/CVariable';
import {
  CPointerType,
  CPrimitiveType,
  CTypeDescriptor,
} from 'frontend/analyze/types';

import { CBuiltinFnDeclType } from 'builtins/CBuiltinFnDeclType';

/**
 * char* alloca (unsigned int bytes);
 */
export class CAllocaBuiltinFn extends CBuiltinFnDeclType {
  constructor(descriptor: CTypeDescriptor) {
    super({
      ...descriptor,
      name: withBuiltinPrefix('alloca'),
      returnType: CPointerType.ofType(CPrimitiveType.char(descriptor.arch)),
      args: [
        new CVariable({
          name: 'size',
          type: CPrimitiveType.int(descriptor.arch),
        }),
      ],
    });
  }
}
