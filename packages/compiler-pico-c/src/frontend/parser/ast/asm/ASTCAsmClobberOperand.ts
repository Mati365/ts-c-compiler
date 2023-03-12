import { dumpAttributesToString } from '@compiler/core/utils';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

export class ASTCAsmClobberOperand extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly name: string) {
    super(ASTCCompilerKind.AsmStmtClobberOperand, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name,
    });
  }
}
