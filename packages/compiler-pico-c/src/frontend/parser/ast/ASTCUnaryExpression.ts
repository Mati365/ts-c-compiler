import { dumpAttributesToString } from '@ts-c-compiler/core';
import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';

import { CType } from 'frontend/analyze';
import { CUnaryCastOperator } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCTypeName } from './ASTCTypeName';
import { ASTCCastExpression } from './ASTCCastExpression';
import { ASTCPostfixExpression } from './ASTCPostfixExpression';

@walkOverFields({
  fields: ['unaryExpression'],
})
export class ASTCIncUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly unaryExpression: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.IncUnaryExpression, loc);
  }
}

@walkOverFields({
  fields: ['unaryExpression'],
})
export class ASTCDecUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly unaryExpression: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.DecUnaryExpression, loc);
  }
}

@walkOverFields({
  fields: ['typeName', 'unaryExpression'],
})
export class ASTCSizeofUnaryExpression extends ASTCCompilerNode {
  extractedType: CType | null = null;

  constructor(
    loc: NodeLocation,
    readonly typeName?: ASTCTypeName,
    readonly unaryExpression?: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.SizeofUnaryExpression, loc);
  }
}

@walkOverFields({
  fields: ['castExpression'],
})
export class ASTCCastUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly operator: CUnaryCastOperator,
    readonly castExpression: ASTCCastExpression,
  ) {
    super(ASTCCompilerKind.CastUnaryExpression, loc);
  }

  toString() {
    const { kind, operator } = this;

    return dumpAttributesToString(kind, {
      operator,
    });
  }
}

@walkOverFields({
  fields: [
    'postfixExpression',
    'castExpression',
    'decExpression',
    'incExpression',
    'sizeofExpression',
  ],
})
export class ASTCUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly postfixExpression?: ASTCPostfixExpression,
    readonly castExpression?: ASTCCastUnaryExpression,
    readonly decExpression?: ASTCDecUnaryExpression,
    readonly incExpression?: ASTCIncUnaryExpression,
    readonly sizeofExpression?: ASTCSizeofUnaryExpression,
  ) {
    super(ASTCCompilerKind.UnaryExpression, loc);
  }
}
