import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCEnumEnumeration} from './ASTCEnumEnumerator';

/**
 * Node that holds C enums
 *
 * @export
 * @class ASTCEnumSpecifier
 * @extends {ASTCCompilerNode}
 */
export class ASTCEnumSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
    public readonly enumerations: ASTCEnumEnumeration[],
  ) {
    super(ASTCCompilerKind.EnumSpecifier, loc);
  }

  toString() {
    const {kind, name} = this;

    return `${kind} ${name ? `name="${name.text}"` : ''}`.trim();
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof ASTCEnumSpecifier
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {enumerations} = this;

    super.walk(visitor);

    if (enumerations)
      enumerations.forEach((arg) => visitor.visit(arg));
  }
}
