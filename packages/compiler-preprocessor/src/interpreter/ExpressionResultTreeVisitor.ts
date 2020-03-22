import * as R from 'ramda';

import {isMathOpToken, evalMathOp} from '@compiler/lexer/utils/isMathOpToken';
import {isRelationOpToken, evalRelationOp} from '@compiler/lexer/utils/isRelationOpToken';
import {isLogicOpToken, evalLogicOp} from '@compiler/lexer/utils/isLogicOpToken';

import {NumberToken} from '@compiler/lexer/tokens';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {
  GrammarError,
  GrammarErrorCode,
} from '@compiler/grammar/GrammarError';

import {ASTPreprocessorNode, ASTPreprocessorKind} from '../constants';
import {ASTPreprocessorValueNode} from '../nodes/ASTPreprocessorValueNode';
import {ASTPreprocessorBinaryOpNode} from '../nodes/ASTPreprocessorBinaryOpNode';
import {
  PreprocessorInterpreter,
  InterpreterResult,
} from './PreprocessorInterpreter';

/**
 * Iterates over ree and calcs expression
 *
 * @export
 * @class ExpressionResultTreeVisitor
 * @extends {TreeVisitor<ASTPreprocessorNode>}
 */
export class ExpressionResultTreeVisitor extends TreeVisitor<ASTPreprocessorNode> {
  private _expressionArgs: InterpreterResult[] = [];

  constructor(
    private readonly _interpreter: PreprocessorInterpreter,
  ) {
    super();
  }

  get value() { return R.last(this._expressionArgs); }

  leave(node: ASTPreprocessorNode) {
    const {_expressionArgs} = this;

    switch (node.kind) {
      case ASTPreprocessorKind.BinaryOperator: {
        const {op} = <ASTPreprocessorBinaryOpNode> node;
        const [left, right] = [_expressionArgs.pop(), _expressionArgs.pop()];
        if (typeof left !== typeof right) {
          throw new GrammarError(
            GrammarErrorCode.EXPRESSION_MISMATCH_ARGS_TYPES,
            node.loc.start,
          );
        }

        const reversedArgs = [right, left];
        let result: InterpreterResult = null;
        if (isMathOpToken(op))
          result = evalMathOp(op, <number[]> reversedArgs);
        else if (isRelationOpToken(op))
          result = evalRelationOp(op, <number[]> reversedArgs);
        else if (isLogicOpToken(op))
          result = evalLogicOp(op, <boolean[]> reversedArgs);

        if (result !== null)
          _expressionArgs.push(result);
        else {
          throw new GrammarError(
            GrammarErrorCode.INCORRECT_EXPRESSION,
            node.loc.start,
          );
        }
      } break;

      case ASTPreprocessorKind.Value:
        _expressionArgs.push(
          (<ASTPreprocessorValueNode<NumberToken>> node).value.value.number,
        );
        break;

      default:
    }
  }
}
