import { walkOverFields } from '@ts-c-compiler/grammar';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export function isASTCExpressionNode(
  node: ASTCCompilerNode,
): node is ASTCExpression {
  return node.kind === ASTCCompilerKind.Expression;
}

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
