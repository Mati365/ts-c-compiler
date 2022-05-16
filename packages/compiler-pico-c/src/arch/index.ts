import * as X86_16 from '@x86-toolkit/codegen';

import {CCompilerArch} from '../constants';
import {SizeofPrimitiveTypeFn} from './utils';

export const SIZEOF_PRIMITIVE_TYPE: Record<CCompilerArch, SizeofPrimitiveTypeFn> = {
  [CCompilerArch.X86_16]: X86_16.sizeofPrimitiveType,
};
