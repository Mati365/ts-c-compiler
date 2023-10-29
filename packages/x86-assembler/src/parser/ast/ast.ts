import { Token } from '@ts-c/lexer';
import { Result } from '@ts-c/core';
import { CompilerError } from '@ts-c/core';

import { ASTAsmParser, ASTAsmTree } from './ASTAsmParser';

import { ASTInstruction } from './instruction/ASTInstruction';
import { ASTLabel } from './critical/ASTLabel';
import { ASTEqu } from './critical/ASTEqu';
import { ASTTimes } from './critical/ASTTimes';
import { ASTDef } from './def/ASTDef';
import { ASTCompilerOption } from './def/ASTCompilerOption';

export const ASTNodesParsers = [
  ASTCompilerOption,
  ASTTimes,
  ASTDef,
  ASTInstruction,
  ASTEqu,
  ASTLabel,
];

/**
 * Root of evil
 */
export function ast(
  tokensIterator: Token[] | IterableIterator<Token>,
): Result<ASTAsmTree, CompilerError[]> {
  const parser = new ASTAsmParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
}
