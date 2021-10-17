/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CCompilerKeyword} from '../../../../constants';
import {CGrammar} from '../shared';
import {ASTCReturn} from '../../../ast/ASTCReturn';
import {expression} from '../expressions/expression';

/**
 * return {expression};
 *
 * @param {CGrammar} grammar
 * @returns {ASTCReturn}
 */
export function returnStmt(grammar: CGrammar): ASTCReturn {
  const {g} = grammar;
  const startToken = g.identifier(CCompilerKeyword.RETURN);

  return new ASTCReturn(
    NodeLocation.fromTokenLoc(startToken.loc),
    expression(grammar),
  );
}
