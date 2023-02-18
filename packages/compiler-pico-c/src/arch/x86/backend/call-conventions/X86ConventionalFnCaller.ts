import { IRCallInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86BackendCompilerContext } from '../../constants/types';
import { X86BackendCompiledFunction } from '../X86FunctionResolver';

export type X86FnCallerCompilerAttrs = {
  context: X86BackendCompilerContext;
  target: X86BackendCompiledFunction;
  callerInstruction: IRCallInstruction;
};

export interface X86ConventionalFnCaller {
  compileIRFnCall(attrs: X86FnCallerCompilerAttrs): string[];
}
