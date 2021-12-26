import {Result, err, ok} from '@compiler/core/monads';
import {ASTCConstantExpression} from '../../parser/ast';
import {CTypeCheckError} from '../errors/CTypeCheckError';
import {TypeCheckerContext} from '../type-checker';
import {MathExpressionEvalVisitor} from './visitors/MathExpressionEvalVisitor';

type EvalMathExpressionAttrs = {
  context: TypeCheckerContext,
  expression: ASTCConstantExpression,
};

export function evalConstantMathExpression(
  {
    context,
    expression,
  }: EvalMathExpressionAttrs,
): Result<number, CTypeCheckError> {
  if (!expression)
    return ok(null);

  try {
    const visitor = (
      new MathExpressionEvalVisitor()
        .setContext(context)
        .visit(expression)
    );

    return ok(+visitor.value);
  } catch (e) {
    console.error(e);

    return err(e);
  }
}
