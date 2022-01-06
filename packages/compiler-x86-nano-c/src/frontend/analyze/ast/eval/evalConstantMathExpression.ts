import {Result, err, ok} from '@compiler/core/monads';
import {ASTCConstantExpression} from '../../../parser/ast';
import {CTypeCheckError} from '../../errors/CTypeCheckError';
import {CAnalyzeContext} from '../../CAnalyzeContext';
import {MathExpressionEvalVisitor} from './visitors/MathExpressionEvalVisitor';

type EvalMathExpressionAttrs = {
  context: CAnalyzeContext,
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
