import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCExpression } from './ASTCExpression';

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
    readonly expression?: ASTCExpression,
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
