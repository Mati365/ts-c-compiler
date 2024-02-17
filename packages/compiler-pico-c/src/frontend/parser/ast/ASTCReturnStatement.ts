import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCReturnStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ReturnStmt, loc);
  }

  hasExpression() {
    return !!this.expression;
  }
}
