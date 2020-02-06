import {Result} from '../../shared/monads/Result';

import {ASTNodeLocation} from '../parser/ast/ASTNode';
import {ParserErrorCode} from '../constants/compilerErrors';

/**
 * Errors thrown during compiling
 *
 * @export
 * @class ParserError
 */
export class ParserError {
  public code: ParserErrorCode;
  public loc: ASTNodeLocation;

  constructor(code: ParserErrorCode, loc?: ASTNodeLocation) {
    this.code = code;
    this.loc = loc;
  }
}

export type ParserResult<T> = Result<T, ParserError>;
