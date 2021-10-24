import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCExpression} from './ASTCExpression';

@walkOverFields(
  {
    fields: ['expression'],
  },
)
export class ASTCPrimaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly identifier?: Token,
    public readonly constant?: Token,
    public readonly stringLiteral?: string,
    public readonly expression?: ASTCExpression,
  ) {
    super(ASTCCompilerKind.PrimaryExpression, loc);
  }
  toString() {
    const {
      kind, identifier,
      constant, stringLiteral,
    } = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        name: identifier?.text,
        constant: constant?.text,
        stringLiteral,
      },
    );
  }
}
