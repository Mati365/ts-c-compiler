import {Token} from '../lexer/tokens';
import {ASTInstruction} from './ASTInstruction';
import {ASTParser} from './ASTParser';

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
