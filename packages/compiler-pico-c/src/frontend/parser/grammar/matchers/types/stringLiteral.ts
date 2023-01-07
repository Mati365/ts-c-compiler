import { Token } from '@compiler/lexer/tokens';
import { TokenKind, TokenType } from '@compiler/lexer/shared';
import { CGrammar } from '../shared';

export function stringLiteral({ g }: CGrammar): Token<string> {
  return g.match({
    type: TokenType.QUOTE,
    kind: TokenKind.DOUBLE_QUOTE,
  });
}
