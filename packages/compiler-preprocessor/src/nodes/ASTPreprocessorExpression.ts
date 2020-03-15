import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 *
 * @export
 * @class ASTPreprocessorLogicalExpression
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorLogicalExpression extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public operator: TokenType,
  ) {
    super(ASTPreprocessorKind.LogicExpression, loc);
  }
}
