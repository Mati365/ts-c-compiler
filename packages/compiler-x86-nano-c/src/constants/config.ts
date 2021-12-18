import type {CLexerConfig} from '../frontend/parser';

export enum CCompilerArch {
  X86_16 = 'X86_16',
}

export type CCompilerConfig = {
  lexer?: CLexerConfig,
  arch: CCompilerArch,
};
