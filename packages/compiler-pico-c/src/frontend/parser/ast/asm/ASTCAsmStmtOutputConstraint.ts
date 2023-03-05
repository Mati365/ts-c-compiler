import { dumpAttributesToString } from '@compiler/core/utils';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

export type AsmOutputConstraintFlags = {
  overwriteExistingValue: boolean;
  readAndWrite: boolean;
  register: boolean;
  memory: boolean;
};

export class ASTCAsmStmtOutputConstraint extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly flags: AsmOutputConstraintFlags) {
    super(ASTCCompilerKind.AsmStmtOutputConstraint, loc);
  }

  toString() {
    const { kind, flags } = this;

    return dumpAttributesToString(kind, flags);
  }
}
