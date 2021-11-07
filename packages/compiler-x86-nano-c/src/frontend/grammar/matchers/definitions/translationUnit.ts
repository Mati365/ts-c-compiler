import * as R from 'ramda';

import {SyntaxError} from '@compiler/grammar/Grammar';
import {ASTCTranslationUnit, ASTCTreeNode} from '../../../ast';
import {CGrammar} from '../shared';

import {externalDeclaration} from '../declarations/externalDeclaration';

/**
 * translation_unit
 *  : external_declaration
 *  | translation_unit external_declaration
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 */
export function translationUnit(grammar: CGrammar): ASTCTranslationUnit {
  const declarations: ASTCTreeNode[] = [];
  const {g} = grammar;

  do {
    const declaration = g.try(() => externalDeclaration(grammar));
    if (!declaration)
      break;

    declarations.push(declaration);
  } while (true);

  if (R.isEmpty(declarations))
    throw new SyntaxError;

  return new ASTCTranslationUnit(declarations[0].loc, declarations);
}
