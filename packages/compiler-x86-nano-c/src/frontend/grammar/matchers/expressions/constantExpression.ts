/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';
import {fetchTokensUntil} from '@compiler/grammar/utils';
import {ASTCConstantExpression} from '../../../ast';
import {CGrammar} from '../shared';
import {ExpressionBreakFn} from './expression';

/**
 * Fetch constant expression
 *
 * @param {CGrammar} c
 * @param {ExpressionBreakFn} breakFn
 * @param {boolean} excludeBreakToken
 * @returns {ASTCConstantExpression}
 */
export function constantExpression(
  {g}: CGrammar,
  breakFn: ExpressionBreakFn = (token: Token) => token.type === TokenType.SEMICOLON,
  excludeBreakToken?: boolean,
): ASTCConstantExpression {
  const tokens = fetchTokensUntil(breakFn, g, excludeBreakToken);
  if (!tokens.length)
    return null;

  return new ASTCConstantExpression(
    NodeLocation.fromTokenLoc(tokens[0].loc),
    tokens,
  );
}
