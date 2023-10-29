import { dumpAttributesToString } from '@ts-c-compiler/core';
import { walkOverFields } from '@ts-c-compiler/grammar';
import { NodeLocation } from '@ts-c-compiler/grammar';

import { ASTCAsmStmtInputOperand } from './ASTCAsmStmtInputOperand';
import { ASTCAsmStmtOutputOperand } from './ASTCAsmStmtOutputOperand';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';
import { ASTCAsmClobberOperand } from './ASTCAsmClobberOperand';

@walkOverFields({
  fields: ['outputOperands', 'inputOperands', 'clobberOperands'],
})
export class ASTCAsmStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly asm: string,
    readonly outputOperands?: ASTCAsmStmtOutputOperand[],
    readonly inputOperands?: ASTCAsmStmtInputOperand[],
    readonly clobberOperands?: ASTCAsmClobberOperand[],
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
