import {CCompilerKeyword} from '@compiler/pico-c/constants';
import {ASTCAlignmentSpecifier} from '../../../ast';
import {CGrammar} from '../shared';

import {typename} from '../types/typename';
import {constantExpression} from '../expressions/constantExpression';

/**
 * alignment_specifier
 *  : ALIGNAS '(' type_name ')'
 *  | ALIGNAS '(' constant_expression ')'
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAlignmentSpecifier}
 */
export function alignmentSpecifier(grammar: CGrammar): ASTCAlignmentSpecifier {
  const {g} = grammar;

  g.identifier(CCompilerKeyword.ALIGN_AS);

  return <ASTCAlignmentSpecifier> g.or(
    {
      typename() {
        const typenameNode = typename(grammar);

        return new ASTCAlignmentSpecifier(typenameNode.loc, typenameNode);
      },
      expr() {
        const expression = constantExpression(grammar);

        return new ASTCAlignmentSpecifier(expression.loc, null, expression);
      },
    },
  );
}
