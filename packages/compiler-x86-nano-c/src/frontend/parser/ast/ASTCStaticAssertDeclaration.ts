import {dumpAttributesToString} from '@compiler/core/utils';
import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCConstantExpression} from './ASTCConstantExpression';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'expression',
    ],
  },
)
export class ASTCStaticAssertDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCConstantExpression,
    readonly literal: Token<string>,
  ) {
    super(ASTCCompilerKind.StaticAssertDeclaration, loc);
  }

  toString() {
    const {kind, literal} = this;

    return dumpAttributesToString(
      kind,
      {
        literal: literal.text,
      },
    );
  }
}
