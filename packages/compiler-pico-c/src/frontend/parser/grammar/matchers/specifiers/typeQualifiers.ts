import * as R from 'ramda';

import { NodeLocation } from '@ts-cc/grammar';
import { CTypeQualifier } from '#constants';
import { SyntaxError } from '@ts-cc/grammar';
import { ASTCTypeQualifiersList } from 'frontend/parser/ast';
import { CGrammar } from '../shared';

import { matchTypeQualifier } from './typeQualifier';

/**
 * type_qualifier_list
 *  : type_qualifier
 *  | type_qualifier_list type_qualifier
 *  ;
 */
export function typeQualifiers(grammar: CGrammar): ASTCTypeQualifiersList {
  const { g } = grammar;
  const items: CTypeQualifier[] = [];

  let loc: NodeLocation = null;

  do {
    if (!loc) {
      loc = NodeLocation.fromTokenLoc(g.currentToken.loc);
    }

    const result = g.try(() => matchTypeQualifier(grammar));
    if (!result) {
      break;
    }

    items.push(result);
  } while (true);

  if (R.isEmpty(items)) {
    throw new SyntaxError();
  }

  return new ASTCTypeQualifiersList(loc, items);
}
