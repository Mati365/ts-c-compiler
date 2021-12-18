import {CCompilerArch} from '../constants';
import {SizeofPrimitiveTypeFn} from './shared';
import * as X86_16 from './x86-16';

export const SIZEOF_PRIMITIVE_TYPE: Record<CCompilerArch, SizeofPrimitiveTypeFn> = {
  [CCompilerArch.X86_16]: X86_16.sizeofPrimitiveType,
};
