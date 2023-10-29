import { walkOverFields } from '@ts-c/grammar';
import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['assignments'],
})
export class ASTCExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly assignments: ASTCCompilerNode[],
    kind: ASTCCompilerKind = ASTCCompilerKind.Expression,
  ) {
    super(kind, loc);
  }
}
