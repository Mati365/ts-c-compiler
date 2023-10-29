import { dumpAttributesToString } from '@ts-c-compiler/core';

import { NodeLocation } from '@ts-c-compiler/grammar';
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
