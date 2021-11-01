import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: ['statement'],
  },
)
export class ASTCSwitchStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
    public readonly statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.SwitchStmt, loc);
  }
}
