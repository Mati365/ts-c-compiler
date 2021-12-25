import {Result} from '@compiler/core/monads';
import {ASTCConstantExpression} from '../../parser/ast';
import {CTypeCheckError} from '../errors/CTypeCheckError';
import {TypeCheckerContext} from '../type-checker/TypeCheckerContext';

type EvalMathExpressionAttrs = {
  context: TypeCheckerContext,
  expression: ASTCConstantExpression,
};

export function evalConstantExpression(
  {
    context,
    expression,
  }: EvalMathExpressionAttrs,
): Result<number, CTypeCheckError> {
  console.info(expression, context);
  return null;
}
