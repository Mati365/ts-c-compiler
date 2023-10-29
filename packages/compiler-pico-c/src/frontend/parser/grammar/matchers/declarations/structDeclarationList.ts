import * as R from 'ramda';

import { SyntaxError } from '@ts-c-compiler/grammar';
import { ASTCStructDeclaration, ASTCStructDeclarationList } from '../../../ast';
import { CGrammar } from '../shared';

import { structDeclaration } from './structDeclaration';

/**
 * struct_declaration_list
 *  : struct_declaration
 *  | struct_declaration_list struct_declaration
 *  ;
 *
 * @see
 *  Empty structures are not part of standard!
 */
export function structDeclarationList(
  grammar: CGrammar,
  allowEmpty: boolean = true,
): ASTCStructDeclarationList {
  const declarations: ASTCStructDeclaration[] = [];
  const { g } = grammar;

  do {
    const declarationNode = g.try(() => structDeclaration(grammar));
    if (!declarationNode) {
      break;
    }

    declarations.push(declarationNode);
  } while (true);

  if (R.isEmpty(declarations)) {
    if (allowEmpty) {
      return null;
    }

    throw new SyntaxError();
  }

  return new ASTCStructDeclarationList(declarations[0].loc, declarations);
}
