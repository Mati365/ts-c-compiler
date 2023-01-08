import type { CLexerConfig } from '../frontend/parser';
import type { IRGeneratorConfig } from '../frontend/ir/constants';

export enum CCompilerArch {
  X86_16 = 'X86_16',
}

export type CCompilerConfig = IRGeneratorConfig & {
  lexer?: CLexerConfig;
};
