import { ASTCAbstractDeclarator } from 'frontend/parser/ast';
import { CGrammar } from '../shared';
import { pointer } from './pointer';
import { directAbstractDeclarator } from './directAbstractDeclarator';

/**
 * abstract_declarator
 *  : pointer direct_abstract_declarator
 *  | pointer
 *  | direct_abstract_declarator
 *  ;
 */
export function abstractDeclarator(grammar: CGrammar): ASTCAbstractDeclarator {
  const { g } = grammar;

  return <ASTCAbstractDeclarator>g.or({
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

      return new ASTCAbstractDeclarator(
        abstractDeclaratorNode.loc,
        null,
        abstractDeclaratorNode,
      );
    },
  });
}
