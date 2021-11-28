import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCDesignatorList, ASTCDesignator} from '../../../ast';
import {CGrammar} from '../shared';

import {fetchSplittedProductionsList} from '../utils/fetchSplittedProductionsList';
import {constantExpression} from '../expressions/constantExpression';

/**
 * designator
 *  : '[' constant_expression ']'
 *  | '.' IDENTIFIER
 *  ;
 *
 * @param {CGrammar} grammar
 * @return {ASTCDesignator}
 */
function designator(grammar: CGrammar): ASTCDesignator {
  const {g} = grammar;

  return <ASTCDesignator> g.or(
    {
      expression() {
        g.terminal('[');
        const expression = constantExpression(grammar);
        g.terminal(']');

        return new ASTCDesignator(expression.loc, expression);
      },

      identifier() {
        const dotToken = g.terminal('.');
        const identifier = g.nonIdentifierKeyword();

        return new ASTCDesignator(
          NodeLocation.fromTokenLoc(dotToken.loc),
          null,
          identifier,
        );
      },
    },
  );
}

/**
 * designator_list
 *  : designator
 *  | designator_list designator
 *  ;
 *
 * @param {CGrammar} grammar
 * @return {ASTCDesignatorList}
 */
function designatorList(grammar: CGrammar): ASTCDesignatorList {
  const {g} = grammar;
  const items = fetchSplittedProductionsList(g, () => designator(grammar));

  return new ASTCDesignatorList(items[0].loc, items);
}

/**
 * designation
 *  : designator_list '='
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCDesignatorList}
 */
export function designation(grammar: CGrammar): ASTCDesignatorList {
  const {g} = grammar;
  const list = designatorList(grammar);

  g.terminal('=');

  return list;
}
