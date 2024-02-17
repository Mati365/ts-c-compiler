import { dumpAttributesToString } from '@ts-cc/core';
import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

export type AsmOutputConstraintFlags = {
  overwriteExistingValue: boolean;
  readAndWrite: boolean;
  register: boolean;
  memory: boolean;
};

export class ASTCAsmStmtOutputConstraint extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly flags: AsmOutputConstraintFlags,
  ) {
    super(ASTCCompilerKind.AsmStmtOutputConstraint, loc);
  }

  toString() {
    const { kind, flags } = this;

    return dumpAttributesToString(kind, flags);
  }
}
