import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import { ASTCAsmStmtInputOperand } from './ASTCAsmStmtInputOperand';
import { ASTCAsmStmtOutputOperand } from './ASTCAsmStmtOutputOperand';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

@walkOverFields({
  fields: ['outputOperands', 'inputOperands'],
})
export class ASTCAsmStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly asm: string,
    readonly outputOperands?: ASTCAsmStmtOutputOperand[],
    readonly inputOperands?: ASTCAsmStmtInputOperand[],
  ) {
    super(ASTCCompilerKind.AsmStmt, loc);
  }

  toString() {
    const { kind, asm } = this;

    return dumpAttributesToString(kind, {
      asm,
    });
  }
}
