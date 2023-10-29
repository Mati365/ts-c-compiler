import { Result, ok, err } from '@ts-c-compiler/core';

export { ok, err };

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = Result<T, ASTExpressionParserError>;
