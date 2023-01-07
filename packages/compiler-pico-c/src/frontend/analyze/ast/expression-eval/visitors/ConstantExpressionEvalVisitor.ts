import * as R from 'ramda';

import {
  evalLogicOp,
  evalMathOp,
  evalRelationOp,
  isLogicOpToken,
  isMathOpToken,
  isNumericToken,
  isRelationOpToken,
} from '@compiler/lexer/utils';

import { NumberToken } from '@compiler/lexer/tokens';
import { CUnaryCastOperator } from '@compiler/pico-c/constants';
import {
  ASTCCompilerKind,
  ASTCBinaryOpNode,
  ASTCPrimaryExpression,
  ASTCCastUnaryExpression,
} from '@compiler/pico-c/frontend/parser/ast';

import { CInnerTypeTreeVisitor } from '../../type-builder/CInnerTypeTreeVisitor';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';

import { charToInt } from '../../../casts';

export type ConstantOperationResult = number | boolean | string;

/**
 * Walks over tree and calculates constant math expressions
 *
 * @see
 *  It is not constexpr! It only evaluates basic 2 + 3 etc. expressions
 */
export class ConstantExpressionEvalVisitor extends CInnerTypeTreeVisitor {
  private expressionArgs: ConstantOperationResult[] = [];

  constructor() {
    super({
      [ASTCCompilerKind.CastUnaryExpression]: {
        leave: (node: ASTCCastUnaryExpression) => {
          this.performUnaryOp(node);
        },
      },

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
    });
  }

  get value() {
    return R.last(this.expressionArgs);
  }

  /**
   * Performs cast operation on prefixes
   *
   * @example
   *  ~5 => -6
   * `!5 => 0
   */
  private performUnaryOp(node: ASTCCastUnaryExpression) {
    const { operator } = node;
    const { expressionArgs } = this;

    let value = expressionArgs.pop();

    switch (operator) {
      case CUnaryCastOperator.SUB:
        value = -value;
        break;
      case CUnaryCastOperator.BITWISE_NOT:
        value = ~value;
        break;
      case CUnaryCastOperator.LOGICAL_NOT:
        value = !value;
        break;
    }

    expressionArgs.push(value);
  }

  /**
   * Pushes constants into expr args stack
   */
  private pushConstant(node: ASTCPrimaryExpression) {
    if (node.isExpression()) {
      return;
    }

    const { expressionArgs, scope } = this;

    if (node.isStringLiteral()) {
      expressionArgs.push(node.stringLiteral);
    } else if (node.isCharLiteral()) {
      expressionArgs.push(charToInt(node.charLiteral));
    } else if (!node.isConstant() || !isNumericToken(node.constant.type)) {
      if (node.isIdentifier()) {
        const compileTimeConst = scope.findCompileTimeConstant(
          node.identifier.text,
        );

        if (!R.isNil(compileTimeConst)) {
          expressionArgs.push(compileTimeConst);
          return;
        }
      }

      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER,
      );
    } else {
      const { value } = <NumberToken>node.constant;
      expressionArgs.push(value.number);
    }
  }

  /**
   * Checks operation and takes Nth values from stack and performs value
   */
  private performBinaryOp(node: ASTCBinaryOpNode): number {
    const { expressionArgs } = this;
    const { op } = node;

    if (R.isNil(op)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND,
      );
    }

    const [left, right] = [expressionArgs.pop(), expressionArgs.pop()];
    if (R.isNil(right)) {
      expressionArgs.push(left);
      return;
    }

    const reversedArgs = [right, left];
    let result: ConstantOperationResult = null;

    if (isMathOpToken(op)) {
      result = evalMathOp(op, <number[]>reversedArgs);
    } else if (isRelationOpToken(op)) {
      result = evalRelationOp(op, <number[]>reversedArgs);
    } else if (isLogicOpToken(op)) {
      result = evalLogicOp(op, <boolean[]>reversedArgs);
    }

    if (result !== null) {
      expressionArgs.push(result);
    } else {
      throw new CTypeCheckError(CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR);
    }
  }
}
