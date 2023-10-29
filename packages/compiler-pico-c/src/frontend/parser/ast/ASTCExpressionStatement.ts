import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCExpressionStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly expression?: ASTCCompilerNode) {
    super(ASTCCompilerKind.ExpressionStmt, loc);
  }
}
