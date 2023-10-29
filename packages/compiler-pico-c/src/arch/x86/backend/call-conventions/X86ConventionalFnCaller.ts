import {
  IRCallInstruction,
  IRFnDeclInstruction,
  IRRetInstruction,
} from 'frontend/ir/instructions';

import { X86BackendCompilerContext } from '../../constants/types';

export type X86FnCallerCompilerAttrs = {
  address: string;
  context: X86BackendCompilerContext;
  declInstruction: IRFnDeclInstruction;
  callerInstruction: IRCallInstruction;
};

export type X86FnBasicCompilerAttrs = {
  declInstruction: IRFnDeclInstruction;
  context: X86BackendCompilerContext;
};

export type X86FnRetCompilerAttrs = X86FnBasicCompilerAttrs & {
  retInstruction: IRRetInstruction;
};

export interface X86ConventionalFnCaller {
  compileIRFnCall(attrs: X86FnCallerCompilerAttrs): string[];
  compileIRFnRet(attrs: X86FnRetCompilerAttrs): string[];
  allocIRFnDefArgs(attrs: X86FnBasicCompilerAttrs): void;
}
