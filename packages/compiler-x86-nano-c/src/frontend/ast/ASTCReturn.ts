import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCReturn extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.Return, loc);
  }

  toString() {
    const {kind, expression} = this;

    return `${kind} expression="${expression?.toString() || ''}"`;
  }
}
