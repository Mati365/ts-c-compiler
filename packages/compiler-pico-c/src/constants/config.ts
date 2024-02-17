import type { X86TargetCPU } from '@ts-cc/x86-assembler';
import type { CLexerConfig } from '../frontend/parser';
import type { IRGeneratorConfig } from '../frontend/ir/constants';
import type { CPreprocessorConfig } from '../frontend/preprocessor/interpreter';

export type CCompilerTargetCPU = X86TargetCPU;

export enum CCompilerArch {
  X86_16 = 'X86_16',
}

export type CCompilerConfig = IRGeneratorConfig & {
  target?: CCompilerTargetCPU;
  lexer?: CLexerConfig;
  preprocessor?: CPreprocessorConfig;
};
