/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';
import {fetchTokensUntil} from '@compiler/grammar/utils';
import {ASTCExpression} from '../../../ast';
import {CGrammar} from '../shared';

type ExpressionBreakFn = (token: Token) => boolean;

/**
 * Fetch expression
 *
 * @param {CGrammar} c
 * @param {ExpressionBreakFn} breakFn
 * @param {boolean} excludeBreakToken
 * @returns {ASTCExpression}
 */
export function expression(
  {g}: CGrammar,
  breakFn: ExpressionBreakFn = (token: Token) => token.type === TokenType.SEMICOLON,
  excludeBreakToken?: boolean,
): ASTCExpression {
  const tokens = fetchTokensUntil(breakFn, g, excludeBreakToken);
  if (!tokens.length)
    return null;

  return new ASTCExpression(
    NodeLocation.fromTokenLoc(tokens[0].loc),
    tokens,
  );
}
