import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CAssignOperator} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

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
    public readonly conditionalExpression?: ASTCCompilerNode,
    public readonly unaryExpression?: ASTCCompilerNode,
    public readonly operator?: CAssignOperator,
    public readonly expression?: ASTCCompilerNode,
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
