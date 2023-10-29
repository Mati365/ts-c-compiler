import { Result, err, ok } from '@ts-c-compiler/core';
import { ASTCCompilerNode } from '../../../parser/ast';
import { CTypeCheckError } from '../../errors/CTypeCheckError';
import { CTypeAnalyzeContext } from '../type-builder/CTypeAnalyzeContext';
import {
  ConstantExpressionEvalVisitor,
  ConstantOperationResult,
} from './visitors/ConstantExpressionEvalVisitor';

type EvalExpressionAttrs = {
  context: CTypeAnalyzeContext;
  expression: ASTCCompilerNode;
};

export function evalConstantExpression({
  context,
  expression,
}: EvalExpressionAttrs): Result<ConstantOperationResult, CTypeCheckError> {
  if (!expression) {
    return ok(null);
  }

  try {
    const visitor = new ConstantExpressionEvalVisitor()
      .setContext(context)
      .visit(expression);

    return ok(visitor.value);
  } catch (e) {
    return err(e);
  }
}
