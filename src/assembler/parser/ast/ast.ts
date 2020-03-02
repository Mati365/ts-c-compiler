import {Token} from '../lexer/tokens';

import {
  ASTParser,
  ASTTree,
} from './ASTParser';

import {ASTInstruction} from './instruction/ASTInstruction';
import {ASTLabel} from './label/ASTLabel';
import {ASTDef} from './def/ASTDef';

export const ASTNodesParsers = [
  ASTDef,
  ASTInstruction,
  ASTLabel,
];

/**
 * Root of evil
 *
 * @export
 * @param {IterableIterator<Token>} tokensIterator
 * @returns {ASTTree}
 */
export function ast(tokensIterator: IterableIterator<Token>): ASTTree {
  const parser = new ASTParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
}
