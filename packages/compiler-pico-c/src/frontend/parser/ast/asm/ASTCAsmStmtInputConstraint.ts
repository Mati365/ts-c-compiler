import { dumpAttributesToString } from '@ts-cc/core';
import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

export type AsmInputConstraintFlags = {
  register: boolean;
  memory: boolean;
};

export class ASTCAsmStmtInputConstraint extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly flags: AsmInputConstraintFlags,
  ) {
    super(ASTCCompilerKind.AsmStmtInputConstraint, loc);
  }

  toString() {
    const { kind, flags } = this;

    return dumpAttributesToString(kind, flags);
  }
}
