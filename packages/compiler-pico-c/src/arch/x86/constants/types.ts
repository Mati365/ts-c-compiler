import type { CCompilerArch } from '@compiler/pico-c/constants';
import type {
  IRCodeFunctionBlock,
  IRFlatCodeSegmentBuilderResult,
} from '@compiler/pico-c/frontend/ir/generator';

import type { IRInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import type { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';
import type { CArchDescriptor } from '../../types';
import type { X86Allocator } from '../backend/X86Allocator';

export type BackendCompiledFunctions = Record<
  string,
  IRCodeFunctionBlock & {
    asm: string[];
  }
>;

export type BackendCompilerContext = {
  arch: CCompilerArch;
  archDescriptor: Readonly<CArchDescriptor>;
  allocator: X86Allocator;
  iterator: IRBlockIterator;
  codeSegment: IRFlatCodeSegmentBuilderResult;
  compiled: {
    functions: BackendCompiledFunctions;
  };
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
