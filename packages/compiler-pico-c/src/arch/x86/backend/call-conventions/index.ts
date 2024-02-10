import { CFunctionCallConvention } from '#constants';

import type { X86ConventionalFnCaller } from './X86ConventionalFnCaller';
import { X86StdcallFnCaller } from './X86StdcallFnCaller';

const X86ConventionalFnCallers: Record<CFunctionCallConvention, X86ConventionalFnCaller> =
  {
    [CFunctionCallConvention.STDCALL]: new X86StdcallFnCaller(),
  };

export const getX86FnCaller = (
  convention: CFunctionCallConvention,
): X86ConventionalFnCaller => X86ConventionalFnCallers[convention];
