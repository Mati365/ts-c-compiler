import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCExpressionStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly expression?: ASTCCompilerNode) {
    super(ASTCCompilerKind.ExpressionStmt, loc);
  }
}
