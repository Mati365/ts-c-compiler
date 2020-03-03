import {Result, ok} from '../../../shared/monads/Result';

export {
  ok,
};

export enum ASTExpressionParserError {
  UNRESOLVED_LABEL,
}

export type ASTExpressionParserResult<T> = Result<T, ASTExpressionParserError>;
