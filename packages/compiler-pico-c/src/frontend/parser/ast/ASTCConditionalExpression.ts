import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['logicalExpression', 'trueExpression', 'falseExpression'],
})
export class ASTCConditionalExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly logicalExpression: ASTCCompilerNode,
    readonly trueExpression?: ASTCCompilerNode,
    readonly falseExpression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ConditionalExpression, loc);
  }
}
