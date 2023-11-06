import * as R from 'ramda';

import { isMathOpToken, evalMathOp } from '@ts-c-compiler/lexer';
import { isRelationOpToken, evalRelationOp } from '@ts-c-compiler/lexer';
import { isLogicOpToken, evalLogicOp } from '@ts-c-compiler/lexer';

import { NumberToken } from '@ts-c-compiler/lexer';
import { TreeVisitor } from '@ts-c-compiler/grammar';

import {
  CPreprocessorError,
  CPreprocessorErrorCode,
} from 'frontend/preprocessor/grammar';

import {
  ASTCExecResult,
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
  ASTCValueNode,
  ASTPreprocessorBinaryOpNode,
} from 'frontend/preprocessor/ast';

import type { CInterpreterContext } from './types';

/**
 * Iterates over tree and calcs expression
 */
export class ExpressionResultTreeVisitor extends TreeVisitor<ASTCPreprocessorTreeNode> {
  private expressionArgs: ASTCExecResult[] = [];

  constructor(private readonly ctx: CInterpreterContext) {
    super();
  }

  get value() {
    return R.last(this.expressionArgs);
  }

  leave(node: ASTCPreprocessorTreeNode) {
    const { expressionArgs, ctx } = this;

    switch (node.kind) {
      case ASTCPreprocessorKind.BinaryOperator:
        {
          const { op } = <ASTPreprocessorBinaryOpNode>node;
          if (R.isNil(op)) {
            return;
          }

          const [left, right] = [expressionArgs.pop(), expressionArgs.pop()];

          if (R.isNil(right)) {
            expressionArgs.push(left);
            return;
          }

          if (typeof left !== typeof right) {
            throw new CPreprocessorError(
              CPreprocessorErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES,
              node.loc.start,
            );
          }

          const reversedArgs = [right, left];
          let result: ASTCExecResult = null;

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
            throw new CPreprocessorError(
              CPreprocessorErrorCode.INCORRECT_EXPRESSION,
              node.loc.start,
            );
          }
        }
        break;

      case ASTCPreprocessorKind.Value:
        {
          const valNode = <ASTCValueNode<NumberToken[]>>node;

          expressionArgs.push(valNode.exec(ctx));
        }
        break;

      default:
    }
  }
}
