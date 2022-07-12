import type {IRInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import type {X86Allocator} from '../backend/X86Allocator';

export type BackendCompilerContext = {
  allocator: X86Allocator;
};

export type CompilerFnAttrs = {
  context: BackendCompilerContext;
};

export type CompilerBlockFnAttrs = CompilerFnAttrs & {
  offset: number;
  instructions: IRInstruction[];
};

export type CompiledBlockOutput = {
  asm: string[];
  offset: number;
};
