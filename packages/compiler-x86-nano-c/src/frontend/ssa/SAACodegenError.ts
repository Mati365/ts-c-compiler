import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum SSACodegenErrorCode {
  UNKNOWN_INSTRUCTION,
}

export const SSA_CODEGEN_ERROR_TRANSLATIONS: Record<SSACodegenErrorCode, string> = {
  [SSACodegenErrorCode.UNKNOWN_INSTRUCTION]: 'Unknown instruction!',
};

/**
 * Error thrown during ssa codegen phase!
 *
 * @export
 * @class SSACodegenError
 * @extends {CompilerError<LexerErrorCode, TokenLocation>}
 */
export class SSACodegenError extends CompilerError<SSACodegenErrorCode, void> {
  constructor(code: SSACodegenErrorCode, meta?: object) {
    super(SSA_CODEGEN_ERROR_TRANSLATIONS, code, null, meta);
  }
}
