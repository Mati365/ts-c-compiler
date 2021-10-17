import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CCompilerKeyword} from '../../../../constants';
import {ASTCIf} from '../../../ast/ASTCIf';

import {CGrammar} from '../shared';
import {logicExpression} from '../expressions/logicExpression';
import {blockStmt} from './blockStmt';

/**
 * if ( <expression> ) {}
 *
 * @returns {ASTCIf}
 */
export function ifStmt(grammar: CGrammar): ASTCIf {
  const {g} = grammar;
  const startToken = g.identifier(CCompilerKeyword.IF);

  g.terminal('(');
  const testExpression = logicExpression(g);
  g.terminal(')');

  return new ASTCIf(
    NodeLocation.fromTokenLoc(startToken.loc),
    testExpression,
    blockStmt(grammar),
  );
}
