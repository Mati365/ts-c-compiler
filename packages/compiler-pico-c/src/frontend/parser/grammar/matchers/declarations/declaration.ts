import * as R from 'ramda';

import { SyntaxError } from '@ts-c/grammar';
import { TokenType } from '@ts-c/lexer';
import {
  ASTCDeclaration,
  ASTCInitDeclarator,
  ASTCInitDeclaratorList,
} from 'frontend/parser/ast';

import { CGrammar } from '../shared';
import { declarationSpecifiers } from '../specifiers';
import { initDeclarator } from './initDeclarator';

/**
 * init_declarator_list
 *  : init_declarator
 *  | init_declarator_list ',' init_declarator
 *  ;
 */
function initDeclaratorList(grammar: CGrammar): ASTCInitDeclaratorList {
  const { g } = grammar;
  const items: ASTCInitDeclarator[] = [];

  do {
    const result = <ASTCInitDeclarator>g.try(() => initDeclarator(grammar));
    if (!result) {
      break;
    }

    items.push(result);

    const comma = g.match({
      type: TokenType.COMMA,
      optional: true,
    });

    if (!comma) {
      break;
    }
  } while (true);

  if (R.isEmpty(items)) {
    throw new SyntaxError();
  }

  return new ASTCInitDeclaratorList(items[0].loc, items);
}

/**
 * declaration
 *  : declaration_specifiers ';'
 *  | declaration_specifiers init_declarator_list ';'
 *  ;
 *
 * declaration_specifiers
 *  : storage_class_specifier
 *  | storage_class_specifier declaration_specifiers
 *  | type_specifier
 *  | type_specifier declaration_specifiers
 *  | type_qualifier
 *  | type_qualifier declaration_specifiers
 *  ;
 */
export function declaration(grammar: CGrammar): ASTCDeclaration {
  const { g } = grammar;

  const specifiers = declarationSpecifiers(grammar);
  let initList: ASTCInitDeclaratorList = null;

  const semicolonToken = g.match({
    type: TokenType.SEMICOLON,
    consume: false,
    optional: true,
  });

  if (semicolonToken) {
    g.consume();
  } else {
    initList = initDeclaratorList(grammar);
    g.match({
      type: TokenType.SEMICOLON,
    });
  }

  const decl = new ASTCDeclaration(specifiers.loc, specifiers, initList);
  grammar.registerDeclaration(decl);
  return decl;
}
