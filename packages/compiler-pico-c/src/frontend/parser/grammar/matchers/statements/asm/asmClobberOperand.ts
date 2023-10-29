import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenKind, TokenType } from '@ts-c-compiler/lexer';
import { ASTCAsmClobberOperand } from 'frontend/parser/ast';

import { CGrammar } from '../../shared';

export function asmClobberOperand(grammar: CGrammar): ASTCAsmClobberOperand {
  const { g } = grammar;

  const literalToken = g.match({
    type: TokenType.QUOTE,
    kind: TokenKind.DOUBLE_QUOTE,
  });

  return new ASTCAsmClobberOperand(
    NodeLocation.fromTokenLoc(literalToken.loc),
    literalToken.text,
  );
}
