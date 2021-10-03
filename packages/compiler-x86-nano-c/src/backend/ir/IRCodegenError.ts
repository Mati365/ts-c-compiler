import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum IRCodegenErrorCode {
  UNKNWON_INSTRUCTION,
}

export const IR_CODEGEN_ERROR_TRANSLATIONS: Record<IRCodegenErrorCode, string> = {
  [IRCodegenErrorCode.UNKNWON_INSTRUCTION]: 'Unknown instruction!',
};

/**
 * Error thrown during ir codegen phase!
 *
 * @export
 * @class IRCodegenError
 * @extends {CompilerError<LexerErrorCode, TokenLocation>}
 */
export class IRCodegenError extends CompilerError<IRCodegenErrorCode, void> {
  constructor(code: IRCodegenErrorCode, meta?: object) {
    super(IR_CODEGEN_ERROR_TRANSLATIONS, code, null, meta);
  }
}
