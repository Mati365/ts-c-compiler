import {dumpAttributesToString} from '@compiler/core/utils';
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

    return dumpAttributesToString(
      kind,
      {
        identifier: identifier?.text,
        constant: constant?.text,
        stringLiteral,
      },
    );
  }

  isConstant() { return !!this.constant; }
  isIdentifier() { return !!this.identifier; }
  isExpression() { return !!this.expression; }
  isStringLiteral() { return !!this.stringLiteral; }
}
