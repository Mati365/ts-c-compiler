import {TokenType} from '@compiler/lexer/shared';
import {ASTCPointer} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

export function pointer(grammar: CGrammar): ASTCPointer {
  const {g} = grammar;

  g.match(
    {
      type: TokenType.NUMBER,
    },
  );

  return null;
}
