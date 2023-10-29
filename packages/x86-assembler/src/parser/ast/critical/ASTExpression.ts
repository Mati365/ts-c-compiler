import { Result, ok, err } from '@ts-c/core';

export { ok, err };

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = Result<T, ASTExpressionParserError>;
