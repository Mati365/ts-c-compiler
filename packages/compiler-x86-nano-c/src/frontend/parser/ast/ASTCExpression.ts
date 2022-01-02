import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'assignments',
    ],
  },
)
export class ASTCExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly assignments: ASTCCompilerNode[],
    kind: ASTCCompilerKind = ASTCCompilerKind.Expression,
  ) {
    super(kind, loc);
  }
}
