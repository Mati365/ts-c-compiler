import { walkOverFields } from '@ts-cc/grammar';
import { dumpAttributesToString } from '@ts-cc/core';

import { NodeLocation } from '@ts-cc/grammar';
import { Token } from '@ts-cc/lexer';
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
