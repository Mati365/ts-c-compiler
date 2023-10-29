import { NodeLocation } from '@ts-c/grammar';
import { TokenType } from '@ts-c/lexer';
import { ASTCParameterDeclaration } from '../../../ast/ASTCParameterDeclaration';
import { ASTCParametersList } from '../../../ast/ASTCParametersList';
import { CGrammar } from '../shared';

import { parameterList } from './parameterList';

/**
 * parameter_type_list
 *  : parameter_list ',' ELLIPSIS
 *  | parameter_list
 *  ;
 */
export function parameterTypeList(grammar: CGrammar): ASTCParametersList {
  const { g } = grammar;
  const list = parameterList(grammar);

  g.try(() => {
    const ellipsisNode = g.match({
      type: TokenType.KEYWORD,
      terminal: '...',
    });

    list.children.push(
      new ASTCParameterDeclaration(
        NodeLocation.fromTokenLoc(ellipsisNode.loc),
        null,
        null,
        null,
        true,
      ),
    );
  });

  return list;
}
