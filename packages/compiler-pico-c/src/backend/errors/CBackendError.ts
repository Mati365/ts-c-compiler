import { CompilerError, fixme } from '@compiler/core/shared';

export enum CBackendErrorCode {
  UNKNOWN_BACKEND_ERROR = 'UNKNOWN_BACKEND_ERROR',
  REG_ALLOCATOR_ERROR = 'REG_ALLOCATOR_ERROR',
  STORE_VAR_ERROR = 'STORE_VAR_ERROR',
  UNABLE_TO_COMPILE_INSTRUCTION = 'UNABLE_TO_COMPILE_INSTRUCTION',
  UNABLE_TO_SPILL_REG = 'UNABLE_TO_SPILL_REG',
  MISSING_BR_INSTRUCTION = 'MISSING_BR_INSTRUCTION',
  INCORRECT_PHI_NODE = 'INCORRECT_PHI_NODE',
  INVALID_STORE_ASSIGNMENT = 'INVALID_STORE_ASSIGNMENT',
  OFFSET_OVERFLOW = 'ALLOC_OFFSET_OVERFLOW',
  EXPECTED_IR_PTR_BUT_RECEIVE = 'EXPECTED_IR_PTR_BUT_RECEIVE',
  VALUE_IS_BIGGER_THAN_REG = 'VALUE_IS_BIGGER_THAN_REG',
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
  [CBackendErrorCode.INCORRECT_PHI_NODE]: fixme('Incorrect phi node!'),
  [CBackendErrorCode.OFFSET_OVERFLOW]:
    'Stack offset overflows variable "%{name}" size! Possible stack corruption!',
  [CBackendErrorCode.INVALID_STORE_ASSIGNMENT]: fixme(
    'Incorrect store assignment!',
  ),
  [CBackendErrorCode.EXPECTED_IR_PTR_BUT_RECEIVE]: fixme(
    'Expected IR pointer but received: "%{type}"!',
  ),
  [CBackendErrorCode.VALUE_IS_BIGGER_THAN_REG]: fixme(
    'Value is bigger than requested reg!',
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
