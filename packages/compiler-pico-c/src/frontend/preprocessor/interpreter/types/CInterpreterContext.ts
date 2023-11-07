import type { Token } from '@ts-c-compiler/lexer';
import type {
  ASTCExecResult,
  ASTCPreprocessorTreeNode,
} from 'frontend/preprocessor/ast';

import type { CPreprocessorMacro } from './CPreprocessorMacro';
import type { CPreprocessorConfig } from './CPreprocessorConfig';

export type CInterpreterContext = {
  config: CPreprocessorConfig;
  isDefined(name: string): boolean;
  defineMacro(name: string, macro: CPreprocessorMacro): void;
  evalTokens(tokens: Token[]): Token[];
  evalExpression(expression: ASTCPreprocessorTreeNode): ASTCExecResult;
  appendFinalTokens(tokens: Token[]): void;
};
