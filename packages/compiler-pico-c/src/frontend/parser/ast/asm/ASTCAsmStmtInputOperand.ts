import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';
import { ASTCAsmStmtInputConstraint } from './ASTCAsmStmtInputConstraint';

@walkOverFields({
  fields: ['constraint', 'expression'],
})
export class ASTCAsmStmtInputOperand extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly constraint: ASTCAsmStmtInputConstraint,
    readonly expression: ASTCCompilerNode,
    readonly symbolicName?: string,
  ) {
    super(ASTCCompilerKind.AsmStmtInputOperand, loc);
  }

  toString() {
    const { kind, symbolicName } = this;

    return dumpAttributesToString(kind, {
      symbolicName,
    });
  }
}
