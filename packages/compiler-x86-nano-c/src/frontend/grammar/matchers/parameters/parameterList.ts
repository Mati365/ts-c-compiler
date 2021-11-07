import * as R from 'ramda';

import {SyntaxError} from '@compiler/grammar/Grammar';
import {TokenType} from '@compiler/lexer/shared';
import {ASTCParametersList, ASTCParameterDeclaration} from '../../../ast';
import {CGrammar} from '../shared';

import {parameterDeclaration} from '../declarations/parameterDeclaration';

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
  const {g} = grammar;
  const items: ASTCParameterDeclaration[] = [];

  do {
    const result = <ASTCParameterDeclaration> g.try(() => parameterDeclaration(grammar));
    if (!result)
      break;

    items.push(result);

    const comma = g.match(
      {
        type: TokenType.COMMA,
        optional: true,
      },
    );

    if (!comma)
      break;
  } while (true);

  if (R.isEmpty(items))
    throw new SyntaxError;

  return new ASTCParametersList(items[0].loc, items);
}
