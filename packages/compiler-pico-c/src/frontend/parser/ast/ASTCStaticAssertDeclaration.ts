import { dumpAttributesToString } from '@ts-c/core';
import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCConstantExpression } from './ASTCConstantExpression';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCStaticAssertDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCConstantExpression,
    readonly literal: string,
  ) {
    super(ASTCCompilerKind.StaticAssertDeclaration, loc);
  }

  toString() {
    const { kind, literal } = this;

    return dumpAttributesToString(kind, {
      literal,
    });
  }
}
