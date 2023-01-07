import { CGrammar } from '../shared';
import { ASTCCompilerNode } from '../../../ast';
import { labeledStatement } from './labeledStatement';
import { compoundStatement } from './compoundStatement';
import { expressionStatement } from './expressionStatement';
import { selectionStatement } from './selectionStatement';
import { iterationStatement } from './iterationStatement';
import { jumpStatement } from './jumpStatement';

/**
 * statement
 *  : labeled_statement
 *  | compound_statement
 *  | expression_statement
 *  | selection_statement
 *  | iteration_statement
 *  | jump_statement
 *  ;
 */
export function statement(grammar: CGrammar): ASTCCompilerNode {
  const { g } = grammar;

  return <ASTCCompilerNode>g.or({
    labeled: () => labeledStatement(grammar),
    compound: () => compoundStatement(grammar),
    iteration: () => iterationStatement(grammar),
    expression: () => expressionStatement(grammar),
    selection: () => selectionStatement(grammar),
    jump: () => jumpStatement(grammar),
  });
}
