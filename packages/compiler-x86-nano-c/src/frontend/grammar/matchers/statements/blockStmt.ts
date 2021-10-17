import {ASTCStmt} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

/**
 * Matches block
 *
 * @param {CGrammar} grammar
 * @returns {ASTCStmt}
 */
export function blockStmt({g, stmt}: CGrammar): ASTCStmt {
  g.terminal('{');
  const content = stmt();
  g.terminal('}');
  return content;
}
