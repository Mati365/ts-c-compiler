import { CStructAlign } from '#constants';
import { withBuiltinPrefix } from 'builtins/utils';

import { CStructEntry } from 'frontend/analyze/types/struct/constants/types';
import {
  CPointerType,
  CPrimitiveType,
  CStructType,
  CTypeDescriptor,
} from 'frontend/analyze/types';

export class CVaListBuiltinStruct extends CStructType {
  constructor(descriptor: CTypeDescriptor) {
    const overflowEntry = new CStructEntry({
      name: 'overflow_arg_area',
      index: 0,
      offset: 0,
      bitset: 0,
      type: CPointerType.ofType(CPrimitiveType.void(descriptor.arch)),
    });

    super({
      ...descriptor,
      name: withBuiltinPrefix('va_list'),
      align: CStructAlign.PACKED,
      fields: new Map([[overflowEntry.name, overflowEntry]]),
    });
  }

  override isEqual(type: CStructType) {
    return type instanceof CVaListBuiltinStruct;
  }
}
