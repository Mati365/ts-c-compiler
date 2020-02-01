import {isWhitespace} from '../../utils/matchCharacter';

import {Token} from '../lexer/tokens';
import ASTInstruction from './ASTInstruction';

export const ASTNodesParsers = [
  ASTInstruction,
];

/**
 * Root of evil
 *
 * @param {Iterator|Token[]} tokensIterator
 */
export const ast = (tokensIterator: IterableIterator<Token>) => {
};
