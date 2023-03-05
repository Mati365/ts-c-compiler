import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';
import { ASTCAsmStmtInputConstraint } from './ASTCAsmStmtInputConstraint';

@walkOverFields({
  fields: ['expression', 'constraint'],
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
