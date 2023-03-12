import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenKind, TokenType } from '@compiler/lexer/shared';
import { ASTCAsmClobberOperand } from '@compiler/pico-c/frontend/parser/ast';

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
