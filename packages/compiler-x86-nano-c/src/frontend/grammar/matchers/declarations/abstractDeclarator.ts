import {ASTCAbstractDeclarator} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';
import {pointer} from './pointer';
import {directAbstractDeclarator} from './directAbstractDeclarator';

/**
 * abstract_declarator
 *  : pointer direct_abstract_declarator
 *  | pointer
 *  | direct_abstract_declarator
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCDeclarator}
 */
export function abstractDeclarator(grammar: CGrammar): ASTCAbstractDeclarator {
  const {g} = grammar;

  return <ASTCAbstractDeclarator> g.or(
    {
      pointerDeclarator() {
        const pointerNode = pointer(grammar);

        return new ASTCAbstractDeclarator(
          pointerNode.loc,
          pointerNode,
          directAbstractDeclarator(grammar),
        );
      },
      pointer() {
        const pointerNode = pointer(grammar);

        return new ASTCAbstractDeclarator(pointerNode.loc, pointerNode);
      },
      declarator() {
        const abstractDeclaratorNode = directAbstractDeclarator(grammar);

        return new ASTCAbstractDeclarator(abstractDeclaratorNode.loc, null, abstractDeclaratorNode);
      },
    },
  );
}
