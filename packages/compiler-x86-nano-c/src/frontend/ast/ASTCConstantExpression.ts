import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCExpression} from './ASTCExpression';

/**
 * Expressions that can be evaluated during compile time
 *
 * @export
 * @class ASTCConstantExpression
 * @extends {ASTCExpression}
 */
export class ASTCConstantExpression extends ASTCExpression {
  constructor(
    loc: NodeLocation,
    expression: Token[],
  ) {
    super(loc, expression, ASTCCompilerKind.ConstantExpression);
  }
}
