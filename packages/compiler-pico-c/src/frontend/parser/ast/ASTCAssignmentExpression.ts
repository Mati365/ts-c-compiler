import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { CAssignOperator } from '@compiler/pico-c/constants';
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
