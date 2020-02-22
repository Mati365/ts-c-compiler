import {Token} from '../lexer/tokens';

import {ASTParser} from './ASTParser';
import {ASTNode} from './ASTNode';

import {ASTInstruction} from './Instruction/ASTInstruction';
import {ASTLabel} from './Label/ASTLabel';
import {ASTDef} from './Def/ASTDef';

export const ASTNodesParsers = [
  ASTInstruction,
  ASTLabel,
  ASTDef,
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
