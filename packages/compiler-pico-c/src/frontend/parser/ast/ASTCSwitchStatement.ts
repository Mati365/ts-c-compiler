import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression', 'statement'],
})
export class ASTCSwitchStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCCompilerNode,
    readonly statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.SwitchStmt, loc);
  }
}
