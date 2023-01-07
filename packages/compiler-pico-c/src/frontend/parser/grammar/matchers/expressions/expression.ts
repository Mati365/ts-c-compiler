import { ASTCExpression, ASTCCompilerNode } from '../../../ast';
import { CGrammar } from '../shared';
import { fetchSplittedProductionsList } from '../utils';

/**
 * Fetch expression
 */
export function expression(grammar: CGrammar): ASTCExpression {
  const { g, assignmentExpression } = grammar;
  const assignments = fetchSplittedProductionsList<ASTCCompilerNode>({
    g,
    prodFn: assignmentExpression,
  });

  return new ASTCExpression(assignments[0].loc, assignments);
}
