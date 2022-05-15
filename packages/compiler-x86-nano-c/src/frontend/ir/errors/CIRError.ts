import {CompilerError} from '@compiler/core/shared';

export enum CIRErrorCode {
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  MISSING_MAIN_FUNCTION = 'MISSING_MAIN_FUNCTION',
}

export const C_IR_ERROR_TRANSLATIONS: Record<CIRErrorCode, string> = {
  [CIRErrorCode.GENERATOR_ERROR]: 'IR Generator error!',
  [CIRErrorCode.MISSING_MAIN_FUNCTION]: 'Missing main function!',
};

/**
 * Error thrown during IR code generation phase
 *
 * @export
 * @class CIRError
 * @extends {CompilerError<CIRErrorCode, null>}
 */
export class CIRError extends CompilerError<CIRErrorCode, null> {
  constructor(code: CIRErrorCode, meta?: object) {
    super(C_IR_ERROR_TRANSLATIONS, code, null, meta);
  }
}
