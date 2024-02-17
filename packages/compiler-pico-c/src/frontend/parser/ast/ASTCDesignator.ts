import { walkOverFields } from '@ts-cc/grammar';
import { dumpAttributesToString } from '@ts-cc/core';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
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
