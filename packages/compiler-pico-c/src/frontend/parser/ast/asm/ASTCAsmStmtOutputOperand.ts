import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';
import { ASTCAsmStmtOutputConstraint } from './ASTCAsmStmtOutputConstraint';

@walkOverFields({
  fields: ['expression', 'constraint'],
})
export class ASTCAsmStmtOutputOperand extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly constraint: ASTCAsmStmtOutputConstraint,
    readonly expression: ASTCCompilerNode,
    readonly symbolicName?: string,
  ) {
    super(ASTCCompilerKind.AsmStmtOutputOperand, loc);
  }

  toString() {
    const { kind, symbolicName } = this;

    return dumpAttributesToString(kind, {
      symbolicName,
    });
  }
}
