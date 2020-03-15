import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 * %if 2 > 4
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIF
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorIF extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly logicExpression: Token[],
    children: ASTPreprocessorNode[],
  ) {
    super(ASTPreprocessorKind.IfStmt, loc, children);
  }
}
