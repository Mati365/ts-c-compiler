import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * C type AST representation
 *
 * @todo
 *  Add pointer support
 *
 * @export
 * @class ASTCType
 * @extends {ASTCCompilerNode}
 */
export class ASTCType extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
  ) {
    super(ASTCCompilerKind.Type, loc);
  }
}
