import {CodeTranslatedError} from '@compiler/core/shared/CodeTranslatedError';

export enum X87ErrorCode {
  STACK_OVERFLOW_OR_UNDERFLOW,
  INVALID_ARITHMETIC_OPERATION,
  DENORMALIZED_OPERAND,
  DIVIDE_BY_ZERO,
  INEXACT_RESULT,
}

export const X87_ERROR_TRANSLATIONS: Record<X87ErrorCode, string> = {
  [X87ErrorCode.STACK_OVERFLOW_OR_UNDERFLOW]: 'Stack overflow or underflow',
  [X87ErrorCode.INVALID_ARITHMETIC_OPERATION]: 'Invalid arithmetic operation',
  [X87ErrorCode.DENORMALIZED_OPERAND]: 'Denormalized operand',
  [X87ErrorCode.DIVIDE_BY_ZERO]: 'Divide by zero',
  [X87ErrorCode.INEXACT_RESULT]: 'Inexact result (precision)',
};

/**
 * Error thrown during fpu operation
 *
 * @export
 * @class X87Error
 * @extends {CodeTranslatedError<X87ErrorCode>}
 */
export class X87Error extends CodeTranslatedError<X87ErrorCode> {
  constructor(code: X87ErrorCode, meta?: object) {
    super(X87_ERROR_TRANSLATIONS, code, meta);
  }
}
