import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';
import { dumpAttributesToString } from '@compiler/core/utils';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { Token } from '@compiler/lexer/tokens';
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
