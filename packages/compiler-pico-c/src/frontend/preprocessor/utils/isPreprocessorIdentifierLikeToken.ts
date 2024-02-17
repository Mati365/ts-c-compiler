import { Token } from '@ts-cc/lexer';

export const isPreprocessorIdentifierLikeToken = (token: Token) =>
  !!token.text && token.text[0] === '#';
