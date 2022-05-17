import {CompilerError} from '@compiler/core/shared';

export enum CIRErrorCode {
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  MISSING_MAIN_FUNCTION = 'MISSING_MAIN_FUNCTION',
  MISSING_BLOCK_NAME = 'MISSING_BLOCK_NAME',
  VARIABLE_MUST_BE_PRIMITIVE = 'VARIABLE_MUST_BE_PRIMITIVE',
}

export const C_IR_ERROR_TRANSLATIONS: Record<CIRErrorCode, string> = {
  [CIRErrorCode.GENERATOR_ERROR]: 'IR Generator error!',
  [CIRErrorCode.MISSING_MAIN_FUNCTION]: 'Missing main function!',
  [CIRErrorCode.MISSING_BLOCK_NAME]: 'Missing block name!',
  [CIRErrorCode.VARIABLE_MUST_BE_PRIMITIVE]: 'Fixme: Variable %{name} must be primitive!',
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
