import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';
import {dumpAttributesToString} from '@compiler/core/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCConstantExpression} from './ASTCConstantExpression';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'constantExpression',
    ],
  },
)
export class ASTCDesignator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly constantExpression?: ASTCConstantExpression,
    public readonly identifier?: Token<string>,
  ) {
    super(ASTCCompilerKind.Designator, loc);
  }

  toString() {
    const {kind, identifier} = this;

    return dumpAttributesToString(
      kind,
      {
        identifier: identifier?.text,
      },
    );
  }
}
