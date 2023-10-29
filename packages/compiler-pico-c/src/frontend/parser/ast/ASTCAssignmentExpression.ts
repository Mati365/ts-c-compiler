import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { CAssignOperator } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['conditionalExpression', 'unaryExpression', 'expression'],
})
export class ASTCAssignmentExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly conditionalExpression?: ASTCCompilerNode,
    readonly unaryExpression?: ASTCCompilerNode,
    readonly operator?: CAssignOperator,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.AssignmentExpression, loc);
  }

  isOperatorExpression() {
    return !!this.operator;
  }

  isUnaryExpression() {
    return !!this.unaryExpression;
  }

  isConditionalExpression() {
    return !!this.conditionalExpression;
  }

  hasNestedExpression() {
    return !!this.expression;
  }

  toString() {
    const { kind, operator } = this;

    return dumpAttributesToString(kind, {
      operator,
    });
  }
}
