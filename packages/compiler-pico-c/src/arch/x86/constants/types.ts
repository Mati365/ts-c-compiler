import type {IRInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import type {IRBlockIterator} from '../backend/iterators/IRBlockIterator';
import type {X86Allocator} from '../backend/X86Allocator';

export type BackendCompilerContext = {
  allocator: X86Allocator;
};

export type CompilerFnAttrs = {
  iterator: IRBlockIterator;
  context: BackendCompilerContext;
};

export type CompilerBlockFnAttrs = CompilerFnAttrs & {
  instructions: IRInstruction[];
};

export type CompiledBlockOutput = {
  asm: string[];
};
