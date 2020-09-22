import {joinTokensTexts} from '@compiler/lexer/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: Token[],
  ) {
    super(ASTCCompilerKind.Expression, loc);
  }

  toString() {
    const {expression} = this;

    return (
      expression
        ? joinTokensTexts(' ', expression)
        : ''
    );
  }
}
