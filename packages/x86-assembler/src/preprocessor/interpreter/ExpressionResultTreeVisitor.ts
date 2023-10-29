import * as R from 'ramda';

import { isMathOpToken, evalMathOp } from '@ts-c/lexer';
import { isRelationOpToken, evalRelationOp } from '@ts-c/lexer';
import { isLogicOpToken, evalLogicOp } from '@ts-c/lexer';

import { NumberToken } from '@ts-c/lexer';
import { TreeVisitor } from '@ts-c/grammar';

import { PreprocessorError, PreprocessorErrorCode } from '../PreprocessorError';

import { ASTPreprocessorNode, ASTPreprocessorKind } from '../constants';
import { ASTPreprocessorValueNode } from '../nodes/ASTPreprocessorValueNode';
import { ASTPreprocessorBinaryOpNode } from '../nodes/ASTPreprocessorBinaryOpNode';
import {
  PreprocessorInterpreter,
  InterpreterResult,
} from './PreprocessorInterpreter';

/**
 * Iterates over tree and calcs expression
 */
export class ExpressionResultTreeVisitor extends TreeVisitor<ASTPreprocessorNode> {
  private expressionArgs: InterpreterResult[] = [];

  constructor(private readonly interpreter: PreprocessorInterpreter) {
    super();
  }

  get value() {
    return R.last(this.expressionArgs);
  }

  leave(node: ASTPreprocessorNode) {
    const { expressionArgs, interpreter } = this;

    switch (node.kind) {
      case ASTPreprocessorKind.BinaryOperator:
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
            throw new PreprocessorError(
              PreprocessorErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES,
              node.loc.start,
            );
          }

          const reversedArgs = [right, left];
          let result: InterpreterResult = null;
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
            throw new PreprocessorError(
              PreprocessorErrorCode.INCORRECT_EXPRESSION,
              node.loc.start,
            );
          }
        }
        break;

      case ASTPreprocessorKind.Value:
        {
          const valNode = <ASTPreprocessorValueNode<NumberToken[]>>node;

          expressionArgs.push(valNode.exec(interpreter));
        }
        break;

      default:
    }
  }
}
