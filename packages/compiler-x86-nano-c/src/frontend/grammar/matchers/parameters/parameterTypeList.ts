import {TokenType} from '@compiler/lexer/shared';
import {ASTCParametersList} from '../../../ast/ASTCParametersList';
import {CGrammar} from '../shared';

import {parameterList} from './parameterList';

/**
 * parameter_type_list
 *  : parameter_list ',' ELLIPSIS
 *  | parameter_list
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCParametersList}
 */
export function parameterTypeList(grammar: CGrammar): ASTCParametersList {
  const {g} = grammar;
  const list = parameterList(grammar);

  g.try(() => {
    g.match(
      {
        type: TokenType.COMMA,
      },
    );

    g.match(
      {
        type: TokenType.KEYWORD,
        terminal: '...',
      },
    );
  });

  return list;
}
