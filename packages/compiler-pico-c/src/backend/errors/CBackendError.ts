import { CompilerError, fixme } from '@ts-c-compiler/core';

export enum CBackendErrorCode {
  UNKNOWN_BACKEND_ERROR = 'UNKNOWN_BACKEND_ERROR',
  REG_ALLOCATOR_ERROR = 'REG_ALLOCATOR_ERROR',
  STORE_VAR_ERROR = 'STORE_VAR_ERROR',
  STORE_VAR_SHOULD_BE_PTR = 'STORE_VAR_SHOULD_BE_PTR',
  UNABLE_TO_COMPILE_INSTRUCTION = 'UNABLE_TO_COMPILE_INSTRUCTION',
  UNABLE_TO_SPILL_REG = 'UNABLE_TO_SPILL_REG',
  MISSING_BR_INSTRUCTION = 'MISSING_BR_INSTRUCTION',
  INCORRECT_PHI_NODE = 'INCORRECT_PHI_NODE',
  INVALID_STORE_ASSIGNMENT = 'INVALID_STORE_ASSIGNMENT',
  OFFSET_OVERFLOW = 'ALLOC_OFFSET_OVERFLOW',
  EXPECTED_IR_PTR_BUT_RECEIVE = 'EXPECTED_IR_PTR_BUT_RECEIVE',
  INCORRECT_MEMCPY_ARGS = 'INCORRECT_MEMCPY_ARGS',
  CALL_ON_NON_CALLABLE_TYPE = 'CALL_ON_NON_CALLABLE_TYPE',
  NON_CALLABLE_STRUCT_ARG = 'NON_CALLABLE_STRUCT_ARG',
  UNKNOWN_MATH_OPERATOR = 'UNKNOWN_MATH_OPERATOR',
  UNABLE_TO_COMPILE_MEMCPY = 'UNABLE_TO_COMPILE_MEMCPY',
  UNKNOWN_BUILTIN_FUNCTION = 'UNKNOWN_BUILTIN_FUNCTION',
  UNABLE_PUSH_ARG_ON_X87_STACK = 'UNABLE_PUSH_ARG_ON_X87_STACK',
  UNABLE_TO_RESOLVE_X87_ARG = 'UNABLE_TO_RESOLVE_X87_ARG',
  CANNOT_OVERRIDE_X87_STACK = 'CANNOT_OVERRIDE_X87_STACK',
}

export const C_BACKEND_ERROR_TRANSLATIONS: Record<CBackendErrorCode, string> = {
  [CBackendErrorCode.UNKNOWN_BACKEND_ERROR]: fixme(
    'Unknown backend compiler error!',
  ),
  [CBackendErrorCode.STORE_VAR_ERROR]: fixme('Store var error!'),
  [CBackendErrorCode.STORE_VAR_SHOULD_BE_PTR]: fixme(
    'Store var should be ptr!',
  ),
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
  [CBackendErrorCode.INCORRECT_MEMCPY_ARGS]: fixme('Incorrect memcpy args!'),
  [CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE]: fixme(
    'Call on non callable type!',
  ),
  [CBackendErrorCode.UNKNOWN_MATH_OPERATOR]: 'Unknown math operator!',
  [CBackendErrorCode.NON_CALLABLE_STRUCT_ARG]: fixme(
    'Called non-callable struct arg!',
  ),
  [CBackendErrorCode.UNABLE_TO_COMPILE_MEMCPY]: fixme(
    'Unable to compile memcpy!',
  ),
  [CBackendErrorCode.UNKNOWN_BUILTIN_FUNCTION]: fixme(
    'Unknown built-in function "%{name}"!',
  ),
  [CBackendErrorCode.UNABLE_PUSH_ARG_ON_X87_STACK]: fixme(
    'Unable to push arg to x87 stack!',
  ),
  [CBackendErrorCode.UNABLE_TO_RESOLVE_X87_ARG]: fixme(
    'Unable to resolve x87 arg!',
  ),
  [CBackendErrorCode.CANNOT_OVERRIDE_X87_STACK]: fixme(
    'Cannot override x87 stack!',
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
