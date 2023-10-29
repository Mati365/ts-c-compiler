import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression', 'statement'],
})
export class ASTCSwitchStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCCompilerNode,
    public statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.SwitchStmt, loc);
  }
}
