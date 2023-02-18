import {
  IRCallInstruction,
  IRFnDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { X86BackendCompilerContext } from '../../constants/types';
import { X86BackendCompiledFunction } from '../X86FunctionResolver';

export type X86FnCallerCompilerAttrs = {
  context: X86BackendCompilerContext;
  target: X86BackendCompiledFunction;
  callerInstruction: IRCallInstruction;
};

export type X86FnDefStackArgsCompilerAttrs = {
  declaration: IRFnDeclInstruction;
  context: X86BackendCompilerContext;
};

export interface X86ConventionalFnCaller {
  compileIRFnCall(attrs: X86FnCallerCompilerAttrs): string[];
  allocIRFnDefStackArgs(attrs: X86FnDefStackArgsCompilerAttrs): void;
}
