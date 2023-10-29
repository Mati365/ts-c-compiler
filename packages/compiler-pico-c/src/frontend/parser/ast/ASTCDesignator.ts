import { walkOverFields } from '@ts-c-compiler/grammar';
import { dumpAttributesToString } from '@ts-c-compiler/core';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { Token } from '@ts-c-compiler/lexer';
import { ASTCConstantExpression } from './ASTCConstantExpression';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['constantExpression'],
})
export class ASTCDesignator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly constantExpression?: ASTCConstantExpression,
    readonly identifier?: Token<string>,
  ) {
    super(ASTCCompilerKind.Designator, loc);
  }

  toString() {
    const { kind, identifier } = this;

    return dumpAttributesToString(kind, {
      identifier: identifier?.text,
    });
  }
}
