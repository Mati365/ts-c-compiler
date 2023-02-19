import {
  IRCallInstruction,
  IRFnDeclInstruction,
  IRRetInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { X86BackendCompilerContext } from '../../constants/types';
import { X86BackendCompiledFunction } from '../X86FunctionResolver';

export type X86FnCallerCompilerAttrs = {
  context: X86BackendCompilerContext;
  target: X86BackendCompiledFunction;
  callerInstruction: IRCallInstruction;
};

export type X86FnBasicCompilerAttrs = {
  declaration: IRFnDeclInstruction;
  context: X86BackendCompilerContext;
};

export type X86FnRetCompilerAttrs = X86FnBasicCompilerAttrs & {
  retInstruction: IRRetInstruction;
};

export interface X86ConventionalFnCaller {
  compileIRFnCall(attrs: X86FnCallerCompilerAttrs): string[];
  compileIRFnRet(attrs: X86FnRetCompilerAttrs): string[];
  allocIRFnDefStackArgs(attrs: X86FnBasicCompilerAttrs): void;
}
