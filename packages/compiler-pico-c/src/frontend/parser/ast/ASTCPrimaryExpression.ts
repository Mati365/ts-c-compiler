import { dumpAttributesToString } from '@ts-cc/core';
import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCPrimaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly identifier?: Token,
    readonly constant?: Token, // number
    readonly stringLiteral?: string,
    readonly charLiteral?: string,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.PrimaryExpression, loc);
  }

  toString() {
    const { kind, identifier, constant, stringLiteral, charLiteral } = this;

    return dumpAttributesToString(kind, {
      identifier: identifier?.text,
      constant: constant?.text,
      charLiteral,
      stringLiteral,
    });
  }

  isConstant() {
    return !!this.constant;
  }

  isIdentifier() {
    return !!this.identifier;
  }

  isExpression() {
    return !!this.expression;
  }

  isStringLiteral() {
    return !!this.stringLiteral;
  }

  isCharLiteral() {
    return !!this.charLiteral;
  }
}
