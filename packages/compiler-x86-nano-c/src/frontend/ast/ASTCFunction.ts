import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCStmt} from './ASTCStmt';
import {ASTCType} from './ASTCType';
import {ASTCVariableDeclaration} from './ASTCVariableDeclarator';

/**
 * C function declaration
 *
 * @export
 * @class ASTCFunction
 * @extends {ASTCCompilerNode}
 */
export class ASTCFunction extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly type: ASTCType,
    public readonly name: string,
    public readonly args: ASTCVariableDeclaration[],
    public readonly body: ASTCStmt,
  ) {
    super(ASTCCompilerKind.Function, loc);
  }

  toString() {
    const {kind, name, type} = this;

    return `${kind} name="${name}" type="${type}"`;
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof ASTCFunction
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {body, args} = this;

    if (args)
      args.forEach((arg) => visitor.visit(arg));

    if (body)
      visitor.visit(body);
  }
}
