import {TokenType} from '@compiler/lexer/tokens';
import {isEOFToken} from '@compiler/lexer/utils';
import {
  ASTCFunction,
  ASTCVariableDeclaration,
} from '../../../ast';

import {CGrammar} from '../shared';
import {blockStmt} from './blockStmt';
import {
  directDeclarator,
  typeDeclaration,
} from '../declarations';

/**
 * Defines C function
 *
 * @param {CGrammar} grammar
 * @returns {ASTCFunction}
 */
export function functionArgs(grammar: CGrammar): ASTCVariableDeclaration[] {
  const {g} = grammar;
  const args: ASTCVariableDeclaration[] = [];

  for (;;) {
    const token = g.fetchRelativeToken(0, false);
    if (isEOFToken(token) || token.text === ')')
      break;

    args.push(
      directDeclarator(grammar),
    );

    const nextToken = g.terminal([')', ','], false);
    if (nextToken.text === ')')
      break;

    g.consume();
  }

  return args;
}

export function functionDeclaration(grammar: CGrammar): ASTCFunction {
  const {g} = grammar;

  const type = typeDeclaration(grammar);
  const name = g.match(
    {
      type: TokenType.KEYWORD,
    },
  );

  g.terminal('(');
  const args = functionArgs(grammar);
  g.terminal(')');

  return new ASTCFunction(
    type.loc, type,
    name.text, args,
    blockStmt(grammar),
  );
}
