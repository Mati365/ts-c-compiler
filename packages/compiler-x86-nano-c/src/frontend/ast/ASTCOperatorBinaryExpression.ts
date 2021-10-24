import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'leftExpression',
      'rightExpression',
    ],
  },
)
export class ASTCOperatorBinaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly operator: TokenType,
    public readonly leftExpression: ASTCCompilerNode,
    public readonly rightExpression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.BinaryOperatorExpression, loc);
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
