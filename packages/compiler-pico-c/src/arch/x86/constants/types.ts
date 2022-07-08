import type {X86Allocator} from '../backend/X86Allocator';

export type BackendCompilerContext = {
  allocator: X86Allocator;
};

export type CompilerFnAttrs = {
  context: BackendCompilerContext;
};
