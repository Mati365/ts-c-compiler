import type { CCompilerArch } from '@compiler/pico-c/constants';
import type { IRFlatCodeSegmentBuilderResult } from '@compiler/pico-c/frontend/ir/generator';

import type { IRInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import type { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';
import type { CArchDescriptor } from '../../types';
import type { X86Allocator } from '../backend/X86Allocator';
import type { X86FunctionResolver } from '../backend/X86FunctionResolver';

export type BackendCompilerContext = {
  arch: CCompilerArch;
  archDescriptor: Readonly<CArchDescriptor>;
  allocator: X86Allocator;
  iterator: IRBlockIterator;
  codeSegment: IRFlatCodeSegmentBuilderResult;
  fnResolver: X86FunctionResolver;
};

export type CompilerFnAttrs = {
  context: BackendCompilerContext;
};

export type CompilerInstructionFnAttrs<I extends IRInstruction> =
  CompilerFnAttrs & {
    instruction: I;
  };

export type CompiledBlockOutput = {
  asm: string[];
};
