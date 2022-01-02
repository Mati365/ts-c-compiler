import * as R from 'ramda';

import {
  evalLogicOp, evalMathOp,
  evalRelationOp, isLogicOpToken,
  isMathOpToken, isRelationOpToken,
} from '@compiler/lexer/utils';

import {TokenType} from '@compiler/lexer/shared';
import {NumberToken} from '@compiler/lexer/tokens';
import {
  ASTCCompilerKind,
  ASTCBinaryOpNode,
  ASTCPrimaryExpression,
} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CInnerTypeTreeVisitor} from '../../ast/type-extractor-visitors/CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';

export type MathOperationResult = number | boolean;

/**
 * Walks over tree and calculates constant math expressions
 *
 * @see
 *  It is not constexpr! It only evaluates basic 2 + 3 etc. expressions
 *
 * @export
 * @class MathExpressionEvalVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class MathExpressionEvalVisitor extends CInnerTypeTreeVisitor {
  private expressionArgs: MathOperationResult[] = [];

  constructor() {
    super(
      {
        [ASTCCompilerKind.BinaryOperator]: {
          leave: (node: ASTCBinaryOpNode) => {
            this.performBinaryOp(node);
          },
        },

        [ASTCCompilerKind.PrimaryExpression]: {
          leave: (node: ASTCPrimaryExpression) => {
            this.pushConstant(node);
          },
        },
      },
    );
  }

  get value() { return R.last(this.expressionArgs); }

  /**
   * Pushes constants into expr args stack
   *
   * @private
   * @param {ASTCPrimaryExpression} node
   * @memberof MathExpressionEvalVisitor
   */
  private pushConstant(node: ASTCPrimaryExpression) {
    if (node.isExpression())
      return;

    if (!node.isConstant() || node.constant.type !== TokenType.NUMBER)
      throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER);

    const {value} = <NumberToken> node.constant;
    this.expressionArgs.push(value.number);
  }

  /**
   * Checks operation and takes Nth values from stack and performs value
   *
   * @private
   * @param {ASTCBinaryOpNode} node
   * @memberof MathExpressionEvalVisitor
   */
  private performBinaryOp(node: ASTCBinaryOpNode): number {
    const {expressionArgs} = this;
    const {op} = node;

    if (R.isNil(op))
      throw new CTypeCheckError(CTypeCheckErrorCode.UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND);

    const [left, right] = [expressionArgs.pop(), expressionArgs.pop()];
    if (R.isNil(right)) {
      expressionArgs.push(left);
      return;
    }

    const reversedArgs = [right, left];
    let result: MathOperationResult = null;
    if (isMathOpToken(op))
      result = evalMathOp(op, <number[]> reversedArgs);
    else if (isRelationOpToken(op))
      result = evalRelationOp(op, <number[]> reversedArgs);
    else if (isLogicOpToken(op))
      result = evalLogicOp(op, <boolean[]> reversedArgs);

    if (result !== null)
      expressionArgs.push(result);
    else
      throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR);
  }
}
