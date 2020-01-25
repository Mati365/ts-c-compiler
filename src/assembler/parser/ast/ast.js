import {isWhitespace} from '../../utils/matchCharacter';
import ASTInstruction from './ASTInstruction';

export const ASTNodesParsers = [
  ASTInstruction,
];

/**
 * Root of evil
 *
 * @param {Iterator|Token[]} tokensIterator
 */
const ast = (tokensIterator) => {
  const tokens = Array.from(tokensIterator);
  const astNodes = [];

  let tokenIndex = 0;
  const recursiveParseParams = {
    /**
     * Fetches next token
     *
     * @param {boolean} [increment=true]
     * @returns
     */
    fetchNextToken(offset = 1, increment = true) {
      const nextToken = tokens[tokenIndex + offset];
      if (increment)
        tokenIndex += offset;

      return nextToken;
    },
  };

  for (; tokenIndex < tokens.length; ++tokenIndex) {
    const token = tokens[tokenIndex];
    let tokenParsed = false;

    for (let j = 0; j < ASTNodesParsers.length; ++j) {
      const astNode = ASTNodesParsers[j].parse(token, recursiveParseParams);

      if (astNode) {
        astNodes.push(astNode);
        tokenParsed = true;

        break;
      }
    }

    if (!isWhitespace(token.text) && !tokenParsed)
      throw new Error(`Unknown token "${token.text}" (type: ${token.type}) at line ${token.loc.row}!`);
  }
};

export default ast;
