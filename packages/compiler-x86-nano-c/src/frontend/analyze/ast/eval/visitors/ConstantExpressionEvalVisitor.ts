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
import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

import {charToInt} from '../../../casts';

export type ConstantOperationResult = number | boolean | string;

/**
 * Walks over tree and calculates constant math expressions
 *
 * @see
 *  It is not constexpr! It only evaluates basic 2 + 3 etc. expressions
 *
 * @export
 * @class ConstantExpressionEvalVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class ConstantExpressionEvalVisitor extends CInnerTypeTreeVisitor {
  private expressionArgs: ConstantOperationResult[] = [];

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
   * @memberof ConstantExpressionEvalVisitor
   */
  private pushConstant(node: ASTCPrimaryExpression) {
    if (node.isExpression())
      return;

    const {expressionArgs, scope} = this;

    if (node.isStringLiteral()) {
      expressionArgs.push(
        node.stringLiteral,
      );
    } else if (node.isCharLiteral()) {
      expressionArgs.push(
        charToInt(node.charLiteral),
      );
    } else if (!node.isConstant() || node.constant.type !== TokenType.NUMBER) {
      if (node.isIdentifier()) {
        const compileTimeConst = scope.findCompileTimeConstant(node.identifier.text);

        if (!R.isNil(compileTimeConst)) {
          expressionArgs.push(compileTimeConst);
          return;
        }
      }

      throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER);
    } else {
      const {value} = <NumberToken> node.constant;
      expressionArgs.push(value.number);
    }
  }

  /**
   * Checks operation and takes Nth values from stack and performs value
   *
   * @private
   * @param {ASTCBinaryOpNode} node
   * @memberof ConstantExpressionEvalVisitor
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
    let result: ConstantOperationResult = null;

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
