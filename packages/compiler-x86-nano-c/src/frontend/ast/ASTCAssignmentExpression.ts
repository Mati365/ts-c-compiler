import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CAssignOperator} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCConditionalExpression} from './ASTCConditionalExpression';
import {ASTCUnaryExpression} from './ASTCUnaryExpression';

@walkOverFields(
  {
    fields: [
      'conditionalExpression',
      'unaryExpression',
      'expression',
    ],
  },
)
export class ASTCAssignmentExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly conditionalExpression?: ASTCConditionalExpression,
    public readonly unaryExpression?: ASTCUnaryExpression,
    public readonly operator?: CAssignOperator,
    public readonly expression?: ASTCAssignmentExpression,
  ) {
    super(ASTCCompilerKind.AssignmentExpression, loc);
  }

  isOperatorExpression() {
    return !!this.operator;
  }

  toString() {
    const {kind, operator} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        operator,
      },
    );
  }
}
