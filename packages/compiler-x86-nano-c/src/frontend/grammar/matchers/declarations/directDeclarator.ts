import {TokenType} from '@compiler/lexer/tokens';
import {ASTCVariableDeclaration} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';
import {typeDeclaration} from './typeDeclaration';

export function directDeclarator(grammar: CGrammar) {
  const {g} = grammar;
  const type = typeDeclaration(grammar);

  return new ASTCVariableDeclaration(
    type.loc,
    type,
    g.match(
      {
        type: TokenType.KEYWORD,
      },
    ).text,
  );
}
