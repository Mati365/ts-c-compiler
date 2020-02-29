import {Token} from '../lexer/tokens';

import {ASTParser} from './ASTParser';
import {ASTNode} from './ASTNode';

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
 * @returns {ASTNode[]}
 */
export function ast(tokensIterator: IterableIterator<Token>): ASTNode[] {
  const parser = new ASTParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
}
