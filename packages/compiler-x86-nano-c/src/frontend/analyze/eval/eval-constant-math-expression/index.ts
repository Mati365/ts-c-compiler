import {Result, err, ok} from '@compiler/core/monads';
import {ASTCConstantExpression} from '../../../parser/ast';
import {CTypeCheckError} from '../../errors/CTypeCheckError';
import {TypeCheckerContext} from '../../type-checker';
import {
  MathExprEvalVisitor,
  MathOperationResult,
} from './MathExprEvalVisitor';

type EvalMathExpressionAttrs = {
  context: TypeCheckerContext,
  expression: ASTCConstantExpression,
};

export function evalConstantMathExpression(
  {
    context,
    expression,
  }: EvalMathExpressionAttrs,
): Result<MathOperationResult, CTypeCheckError> {
  try {
    const visitor = (
      new MathExprEvalVisitor()
        .setContext(context)
        .visit(expression)
    );

    return ok(visitor.value);
  } catch (e) {
    console.error(e);

    return err(e);
  }
}
