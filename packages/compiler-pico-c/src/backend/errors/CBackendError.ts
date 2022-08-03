import {CompilerError, fixme} from '@compiler/core/shared';

export enum CBackendErrorCode {
  UNKNOWN_BACKEND_ERROR = 'UNKNOWN_BACKEND_ERROR',
  REG_ALLOCATOR_ERROR = 'REG_ALLOCATOR_ERROR',
}

export const C_BACKEND_ERROR_TRANSLATIONS: Record<CBackendErrorCode, string> = {
  [CBackendErrorCode.UNKNOWN_BACKEND_ERROR]: fixme('Unknown backend compiler error!'),
  [CBackendErrorCode.REG_ALLOCATOR_ERROR]: fixme('Reg allocator error!'),
};

/**
 * Error thrown during backend code generation phase
 *
 * @export
 * @class CBackendError
 * @extends {CompilerError<CBackendErrorCode, null>}
 */
export class CBackendError extends CompilerError<CBackendErrorCode, null> {
  constructor(code: CBackendErrorCode, meta?: object) {
    super(C_BACKEND_ERROR_TRANSLATIONS, code, null, meta);
  }
}
