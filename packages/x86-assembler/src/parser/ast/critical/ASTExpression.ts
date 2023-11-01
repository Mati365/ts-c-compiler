import type * as E from 'fp-ts/Either';

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = E.Either<
  ASTExpressionParserError,
  T
>;
