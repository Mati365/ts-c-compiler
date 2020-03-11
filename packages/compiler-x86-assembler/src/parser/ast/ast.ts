import {Token} from '@compiler/lexer/tokens';
import {Result} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {
  ASTParser,
  ASTTree,
} from './ASTParser';

import {ASTInstruction} from './instruction/ASTInstruction';
import {ASTLabel} from './critical/ASTLabel';
import {ASTEqu} from './critical/ASTEqu';
import {ASTTimes} from './critical/ASTTimes';
import {ASTDef} from './def/ASTDef';
import {ASTCompilerOption} from './def/ASTCompilerOption';

export const ASTNodesParsers = [
  ASTCompilerOption,
  ASTTimes,
  ASTDef,
  ASTInstruction,
  ASTLabel,
  ASTEqu,
];

/**
 * Root of evil
 *
 * @export
 * @param {Token[]|IterableIterator<Token>} tokensIterator
 * @returns {Result<ASTTree, CompilerError[]>}
 */
export function ast(tokensIterator: Token[]|IterableIterator<Token>): Result<ASTTree, CompilerError[]> {
  const parser = new ASTParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
}
