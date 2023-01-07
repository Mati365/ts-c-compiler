import * as R from 'ramda';

import { SyntaxError } from '@compiler/grammar/Grammar';
import { ASTCDeclaration, ASTCDeclarationsList } from '../../../ast';
import { CGrammar } from '../shared';
import { declaration } from './declaration';

/**
 * declaration_list
 *  : declaration
 *  | declaration_list declaration
 *  ;
 */
export function declarationList(grammar: CGrammar): ASTCDeclarationsList {
  const declarations: ASTCDeclaration[] = [];
  const { g } = grammar;

  do {
    const declarationNode = g.try(() => declaration(grammar));
    if (!declarationNode) {
      break;
    }

    declarations.push(declarationNode);
  } while (true);

  if (R.isEmpty(declarations)) {
    throw new SyntaxError();
  }

  return new ASTCDeclarationsList(declarations[0].loc, declarations);
}
