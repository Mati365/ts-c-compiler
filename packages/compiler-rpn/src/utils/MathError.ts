import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum MathErrorCode {
  MISSING_LEFT_BRACKET,
  MISSING_OPERANDS,
  INCORRECT_BRACKETS,
  UNKNOWN_KEYWORD,
}

export const MATH_ERROR_TRANSLATIONS: {[key in MathErrorCode]: string} = {
  [MathErrorCode.MISSING_LEFT_BRACKET]: 'Missing left bracket!',
  [MathErrorCode.MISSING_OPERANDS]: 'Missing operands!',
  [MathErrorCode.INCORRECT_BRACKETS]: 'Incorrect brackets!',
  [MathErrorCode.UNKNOWN_KEYWORD]: 'Unknown label "%{token}"!',
};

/**
 * @export
 * @class MathError
 * @extends {CompilerError<MathErrorCode, number>}
 */
export class MathError extends CompilerError<MathErrorCode, number> {
  constructor(code: MathErrorCode, meta?: object) {
    super(MATH_ERROR_TRANSLATIONS, code, null, meta);
    this.name = 'Math expression';
  }
}
