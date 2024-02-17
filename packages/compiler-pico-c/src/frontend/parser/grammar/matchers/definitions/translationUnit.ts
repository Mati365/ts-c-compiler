import * as R from 'ramda';

import { isEOFToken } from '@ts-cc/lexer';

import { SyntaxError } from '@ts-cc/grammar';
import { ASTCTranslationUnit, ASTCTreeNode } from '../../../ast';
import { CGrammar } from '../shared';

import { externalDeclaration } from '../declarations/externalDeclaration';

/**
 * translation_unit
 *  : external_declaration
 *  | translation_unit external_declaration
 *  ;
 */
export function translationUnit(grammar: CGrammar): ASTCTranslationUnit {
  const declarations: ASTCTreeNode[] = [];
  const { g } = grammar;

  do {
    declarations.push(externalDeclaration(grammar));

    if (isEOFToken(g.currentToken)) {
      break;
    }
  } while (true);

  if (R.isEmpty(declarations)) {
    throw new SyntaxError();
  }

  return new ASTCTranslationUnit(declarations[0].loc, declarations);
}
