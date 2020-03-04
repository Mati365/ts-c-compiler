import {Result, ok, err} from '../../../../shared/monads/Result';

export {
  ok,
  err,
};

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = Result<T, ASTExpressionParserError>;
