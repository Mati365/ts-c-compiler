import {ASTCParametersList, ASTCParameterDeclaration} from '../../../ast';
import {CGrammar} from '../shared';

import {parameterDeclaration} from '../declarations/parameterDeclaration';
import {fetchSplittedProductionsList} from '../utils';

/**
 * parameter_list
 *  : parameter_declaration
 *  | parameter_list ',' parameter_declaration
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCParametersList}
 */
export function parameterList(grammar: CGrammar): ASTCParametersList {
  const items = fetchSplittedProductionsList<ASTCParameterDeclaration>(
    {
      g: grammar.g,
      prodFn: () => parameterDeclaration(grammar),
    },
  );

  return new ASTCParametersList(items[0].loc, items);
}
