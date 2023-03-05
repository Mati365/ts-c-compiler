import { dumpAttributesToString } from '@compiler/core/utils';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from '../ASTCCompilerNode';

export type AsmInputConstraintFlags = {
  register: boolean;
  memory: boolean;
};

export class ASTCAsmStmtInputConstraint extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly flags: AsmInputConstraintFlags) {
    super(ASTCCompilerKind.AsmStmtInputConstraint, loc);
  }

  toString() {
    const { kind, flags } = this;

    return dumpAttributesToString(kind, flags);
  }
}
