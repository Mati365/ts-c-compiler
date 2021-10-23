import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';

import {CGrammar} from '../shared';
import {
  ASTCCompilerNode,
  ASTCVariableDeclaration,
  ASTCVariableDeclarator,
} from '../../../ast';

import {expression} from '../expressions/expression';
import {directDeclarator} from './directDeclarator';

/**
 * Declaration of variable / constant
 *
 * @param {CGrammar} grammar
 * @returns {ASTCVariableDeclarator}
 */
export function variableDeclaration(grammar: CGrammar): ASTCVariableDeclarator {
  const {g} = grammar;
  const type = directDeclarator(grammar);
  const declarations: ASTCVariableDeclaration[] = [];

  for (;;) {
    let varValueExpression: ASTCCompilerNode = null;
    const varNameToken = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    if (g.match({type: TokenType.ASSIGN, optional: true})) {
      varValueExpression = expression(
        grammar,
        (token) => token.type === TokenType.COMMA || token.type === TokenType.SEMICOLON,
        true,
      );
    }

    declarations.push(
      new ASTCVariableDeclaration(
        NodeLocation.fromTokenLoc(varNameToken.loc),
        type,
        varNameToken.text,
        varValueExpression,
      ),
    );

    const token = g.match(
      {
        types: [
          TokenType.COMMA,
          TokenType.SEMICOLON,
        ],
      },
    );

    if (token.type === TokenType.SEMICOLON
        || token.type === TokenType.EOF)
      break;
  }

  return new ASTCVariableDeclarator(type.loc, declarations);
}
