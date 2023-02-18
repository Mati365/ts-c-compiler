import { CFunctionCallConvention } from '@compiler/pico-c/constants';

import type { X86ConventionalFnCaller } from './X86ConventionalFnCaller';
import { X86CdeclFnCaller } from './X86CdeclFnCaller';

const X86ConventionalFnCallers: Record<
  CFunctionCallConvention,
  X86ConventionalFnCaller
> = {
  [CFunctionCallConvention.CDECL]: new X86CdeclFnCaller(),
};

export const getX86FnCaller = (
  convention: CFunctionCallConvention,
): X86ConventionalFnCaller => X86ConventionalFnCallers[convention];
