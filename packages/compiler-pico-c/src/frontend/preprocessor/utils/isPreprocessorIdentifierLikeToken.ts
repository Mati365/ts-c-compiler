import { Token } from '@ts-c-compiler/lexer';

export const isPreprocessorIdentifierLikeToken = (token: Token) =>
  !!token.text && token.text[0] === '#';
