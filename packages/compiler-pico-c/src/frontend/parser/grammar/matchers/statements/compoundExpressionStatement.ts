import * as R from 'ramda';

import { NodeLocation, SyntaxError } from '@ts-c-compiler/grammar';

import { CGrammar } from '../shared';
import {
  ASTCCompoundExpressionStmt,
  isASTCExpressionStmtNode,
} from '../../../ast';

import { blockItemList } from './compoundStatement';

/**
 * compound_expression_statement
 *  : '({' block_item_list '})'
 *  ;
 */
export function compoundExpressionStatement(grammar: CGrammar) {
  const { g } = grammar;

  const startToken = g.terminals('({');
  const { children } = blockItemList(grammar);
  g.terminals('})');

  const maybeExpressionStmt = R.last(children);
  const items = R.init(children);

  if (!isASTCExpressionStmtNode(maybeExpressionStmt)) {
    throw new SyntaxError();
  }

  return new ASTCCompoundExpressionStmt(
    NodeLocation.fromTokenLoc(startToken.loc),
    items,
    maybeExpressionStmt,
  );
}
