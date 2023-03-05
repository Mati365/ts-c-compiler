import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCAsmStmtInputOperands extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly symbolicName?: string,
    readonly constraint?: string,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.AsmStmtInputOperands, loc);
  }

  toString() {
    const { kind, symbolicName, constraint } = this;

    return dumpAttributesToString(kind, {
      symbolicName,
      constraint,
    });
  }
}
