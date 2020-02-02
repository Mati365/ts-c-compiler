import {Token} from '../lexer/tokens';

import {ASTParser} from './ASTParser';
import {ASTInstruction} from './Instruction/ASTInstruction';

export const ASTNodesParsers = [
  ASTInstruction,
];

/**
 * Root of evil
 *
 * @param {Iterator|Token[]} tokensIterator
 */
export const ast = (tokensIterator: IterableIterator<Token>) => {
  const parser = new ASTParser(ASTNodesParsers, tokensIterator);

  return parser.getTree();
};
