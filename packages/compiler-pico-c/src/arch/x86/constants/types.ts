import type { CCompilerArch } from '@compiler/pico-c/constants';
import type { IRFlatCodeSegmentBuilderResult } from '@compiler/pico-c/frontend/ir/generator';

import type { IRInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import type { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';
import type { CArchDescriptor } from '../../types';
import type { X86Allocator } from '../backend/X86Allocator';
import type { X86LabelsResolver } from '../backend/X86LabelsResolver';

export type X86BackendCompilerContext = {
  arch: CCompilerArch;
  archDescriptor: Readonly<CArchDescriptor>;
  allocator: X86Allocator;
  iterator: IRBlockIterator;
  codeSegment: IRFlatCodeSegmentBuilderResult;
  labelsResolver: X86LabelsResolver;
};

export type X86CompilerFnAttrs = {
  context: X86BackendCompilerContext;
};

export type X86CompilerInstructionFnAttrs<I extends IRInstruction> =
  X86CompilerFnAttrs & {
    instruction: I;
  };

export type X86CompiledBlockOutput = {
  asm: string[];
};
