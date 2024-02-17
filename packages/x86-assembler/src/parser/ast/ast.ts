import { Token } from '@ts-cc/lexer';
import { ASTAsmParser } from './ASTAsmParser';

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
export function ast(tokensIterator: Token[] | IterableIterator<Token>) {
  const parser = new ASTAsmParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
}
