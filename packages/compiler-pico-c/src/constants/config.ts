import type { CLexerConfig } from '../frontend/parser';
import type { IROptimizerConfig } from '../optimizer/constants/types';

export enum CCompilerArch {
  X86_16 = 'X86_16',
}

export type CCompilerConfig = {
  lexer?: CLexerConfig;
  arch: CCompilerArch;
  optimization: IROptimizerConfig;
};
