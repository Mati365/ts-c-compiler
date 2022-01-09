import {Result, err, ok} from '@compiler/core/monads';
import {ASTCCompilerNode} from '../../../parser/ast';
import {CTypeCheckError} from '../../errors/CTypeCheckError';
import {CTypeAnalyzeContext} from '../CTypeAnalyzeContext';
import {
  ConstantExpressionEvalVisitor,
  ConstantOperationResult,
} from './visitors/ConstantExpressionEvalVisitor';

type EvalExpressionAttrs = {
  context: CTypeAnalyzeContext,
  expression: ASTCCompilerNode,
};

export function evalConstantExpression(
  {
    context,
    expression,
  }: EvalExpressionAttrs,
): Result<ConstantOperationResult, CTypeCheckError> {
  if (!expression)
    return ok(null);

  try {
    const visitor = (
      new ConstantExpressionEvalVisitor()
        .setContext(context)
        .visit(expression)
    );

    return ok(visitor.value);
  } catch (e) {
    console.error(e);

    return err(e);
  }
}
