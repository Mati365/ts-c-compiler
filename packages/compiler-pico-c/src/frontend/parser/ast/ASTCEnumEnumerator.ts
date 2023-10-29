import { walkOverFields } from '@ts-c/grammar';
import { dumpAttributesToString } from '@ts-c/core';

import { NodeLocation } from '@ts-c/grammar';
import { Token } from '@ts-c/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCConstantExpression } from './ASTCConstantExpression';

/**
 * Node that holds single enum item such as RED = 'blue'
 */
@walkOverFields({
  fields: ['expression'],
})
export class ASTCEnumEnumeration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
    readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.EnumItem, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name,
    });
  }
}
