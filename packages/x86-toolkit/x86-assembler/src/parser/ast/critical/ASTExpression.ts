import { Result, ok, err } from '@compiler/core/monads/Result';

export { ok, err };

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = Result<T, ASTExpressionParserError>;
