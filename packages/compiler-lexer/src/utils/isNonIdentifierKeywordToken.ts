import {Token} from '../tokens/Token';
import {TokenType} from '../shared/TokenTypes';

export function isNonIdentifierKeywordToken(token: Token) {
  return token?.type === TokenType.KEYWORD && token.kind === null;
}
