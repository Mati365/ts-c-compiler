import {joinTokensTexts} from '@compiler/lexer/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: Token[],
    kind: ASTCCompilerKind = ASTCCompilerKind.Expression,
  ) {
    super(kind, loc);
  }

  toString() {
    const {kind, expression} = this;
    const tokens = (
      expression
        ? joinTokensTexts(' ', expression)
        : ''
    );

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        expression: tokens,
      },
    );
  }
}
