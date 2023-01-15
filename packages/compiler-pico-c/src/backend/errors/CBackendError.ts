import { CompilerError, fixme } from '@compiler/core/shared';

export enum CBackendErrorCode {
  UNKNOWN_BACKEND_ERROR = 'UNKNOWN_BACKEND_ERROR',
  REG_ALLOCATOR_ERROR = 'REG_ALLOCATOR_ERROR',
  STORE_VAR_ERROR = 'STORE_VAR_ERROR',
  UNABLE_TO_COMPILE_INSTRUCTION = 'UNABLE_TO_COMPILE_INSTRUCTION',
  UNABLE_TO_SPILL_REG = 'UNABLE_TO_SPILL_REG',
  MISSING_BR_INSTRUCTION = 'MISSING_BR_INSTRUCTION',
}

export const C_BACKEND_ERROR_TRANSLATIONS: Record<CBackendErrorCode, string> = {
  [CBackendErrorCode.UNKNOWN_BACKEND_ERROR]: fixme(
    'Unknown backend compiler error!',
  ),
  [CBackendErrorCode.STORE_VAR_ERROR]: fixme('Store var error!'),
  [CBackendErrorCode.REG_ALLOCATOR_ERROR]: fixme('Reg allocator error!'),
  [CBackendErrorCode.UNABLE_TO_SPILL_REG]: fixme('Unable to spill %{reg} reg!'),
  [CBackendErrorCode.MISSING_BR_INSTRUCTION]: fixme('Missing br instruction!'),
  [CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION]: fixme(
    'Unable to compile instruction!',
  ),
};

/**
 * Error thrown during backend code generation phase
 */
export class CBackendError extends CompilerError<CBackendErrorCode, null> {
  constructor(code: CBackendErrorCode, meta?: object) {
    super(C_BACKEND_ERROR_TRANSLATIONS, code, null, meta);
  }
}
