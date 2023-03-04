import { dumpAttributesToString } from '@compiler/core/utils';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCAsmStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly expression: string) {
    super(ASTCCompilerKind.AsmStmt, loc);
  }

  toString() {
    const { kind, expression } = this;

    return dumpAttributesToString(kind, {
      expression,
    });
  }
}
