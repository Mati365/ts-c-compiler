import * as E from 'fp-ts/Either';

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
}: EvalExpressionAttrs): E.Either<CTypeCheckError, ConstantOperationResult> {
  if (!expression) {
    return E.right(null);
  }

  try {
    const visitor = new ConstantExpressionEvalVisitor()
      .setContext(context)
      .visit(expression);

    return E.right(visitor.value);
  } catch (e) {
    return E.left(e);
  }
}
