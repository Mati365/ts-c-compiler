import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCPointer} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

import {typeQualifiers} from '../specifiers/typeQualifiers';

/**
 * pointer
 *  : '*' type_qualifier_list pointer
 *  | '*' type_qualifier_list
 *  | '*' pointer
 *  | '*'
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCPointer}
 */
export function pointer(grammar: CGrammar): ASTCPointer {
  const {g} = grammar;
  const loc = NodeLocation.fromTokenLoc(g.terminal('*').loc);

  return new ASTCPointer(
    loc,
    g.try(() => typeQualifiers(grammar)),
    g.try(() => pointer(grammar)),
  );
}
