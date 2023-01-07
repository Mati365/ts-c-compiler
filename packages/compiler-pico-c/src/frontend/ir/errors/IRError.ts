import { CompilerError, fixme } from '@compiler/core/shared';

export enum IRErrorCode {
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  MISSING_MAIN_FUNCTION = 'MISSING_MAIN_FUNCTION',
  MISSING_BLOCK_NAME = 'MISSING_BLOCK_NAME',
  VARIABLE_MUST_BE_PRIMITIVE = 'VARIABLE_MUST_BE_PRIMITIVE',
  INCORRECT_INITIALIZER_BLOCK = 'INCORRECT_INITIALIZER_BLOCK',
  UNABLE_TO_COMPILE_EXPRESSION = 'UNABLE_TO_COMPILE_EXPRESSION',
  UNRESOLVED_IDENTIFIER = 'UNRESOLVED_IDENTIFIER',
  ACCESS_ARRAY_INDEX_TO_NON_ARRAY = 'ACCESS_ARRAY_INDEX_TO_NON_ARRAY',
  ACCESS_STRUCT_ATTR_IN_NON_STRUCT = 'ACCESS_STRUCT_ATTR_IN_NON_STRUCT',
  UNRESOLVED_ASSIGN_EXPRESSION = 'UNRESOLVED_ASSIGN_EXPRESSION',
  INCORRECT_POINTER_EXPR = 'INCORRECT_POINTER_EXPR',
  INCORRECT_UNARY_EXPR = 'INCORRECT_UNARY_EXPR',
  UNABLE_INC_NON_PTR_TYPE = 'UNABLE_INC_NON_PTR_TYPE',
  CANNOT_DEREFERENCE_NON_PTR_TYPE = 'CANNOT_DEREFERENCE_NON_PTR_TYPE',
  CANNOT_LOAD_PRIMARY_EXPRESSION = 'CANNOT_LOAD_PRIMARY_EXPRESSION',
  PROVIDED_TYPE_IS_NOT_CALLABLE = 'PROVIDED_TYPE_IS_NOT_CALLABLE',
  MISSING_FUNC_DECL_IN_ALLOCATOR = 'MISSING_FUNC_DECL_IN_ALLOCATOR',
  RVO_RETURN_CONSTANT = 'RVO_RETURNED_CONSTANT',
  RVO_OPTIMIZATION_FAIL = 'RVO_OPTIMIZATION_FAIL',
  EXPECTED_CONDITION_FLAG_RESULT = 'EXPECTED_CONDITION_FLAG_RESULT',
}

export const C_IR_ERROR_TRANSLATIONS: Record<IRErrorCode, string> = {
  [IRErrorCode.GENERATOR_ERROR]: 'IR Generator error!',
  [IRErrorCode.MISSING_MAIN_FUNCTION]: 'Missing main function!',
  [IRErrorCode.MISSING_BLOCK_NAME]: 'Missing block name!',
  [IRErrorCode.VARIABLE_MUST_BE_PRIMITIVE]: fixme(
    'Variable %{name} must be primitive!',
  ),
  [IRErrorCode.INCORRECT_INITIALIZER_BLOCK]: fixme(
    'Incorrect initializer block!',
  ),
  [IRErrorCode.UNABLE_TO_COMPILE_EXPRESSION]: fixme(
    'Unable to compile expression!',
  ),
  [IRErrorCode.UNRESOLVED_IDENTIFIER]: fixme(
    'Unresolved expression IR output variable!',
  ),
  [IRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY]: fixme(
    'Trying to access non array type via index!',
  ),
  [IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT]: fixme(
    'Trying to access struct field on non struct type!',
  ),
  [IRErrorCode.UNRESOLVED_ASSIGN_EXPRESSION]: fixme(
    'Unresolved assign expression!',
  ),
  [IRErrorCode.INCORRECT_POINTER_EXPR]: fixme('Incorrect pointer expression!'),
  [IRErrorCode.INCORRECT_UNARY_EXPR]: fixme('Incorrect unary expression!'),
  [IRErrorCode.UNABLE_INC_NON_PTR_TYPE]: fixme(
    'Unable increment non pointer type!',
  ),
  [IRErrorCode.CANNOT_DEREFERENCE_NON_PTR_TYPE]: fixme(
    'Cannot dereference non ptr type!',
  ),
  [IRErrorCode.CANNOT_LOAD_PRIMARY_EXPRESSION]: fixme(
    'Cannot load primary expression!',
  ),
  [IRErrorCode.PROVIDED_TYPE_IS_NOT_CALLABLE]:
    'Provided type "%{typeName}" is not callable!',
  [IRErrorCode.MISSING_FUNC_DECL_IN_ALLOCATOR]: fixme(
    'Missing function "%{name}" declaration in allocator!',
  ),
  [IRErrorCode.RVO_RETURN_CONSTANT]: fixme('RVO should not return constant!'),
  [IRErrorCode.RVO_OPTIMIZATION_FAIL]: fixme('RVO optimization failed!'),
  [IRErrorCode.EXPECTED_CONDITION_FLAG_RESULT]: fixme(
    'Logic expression should return flag type!',
  ),
};

/**
 * Error thrown during IR code generation phase
 */
export class IRError extends CompilerError<IRErrorCode, null> {
  constructor(code: IRErrorCode, meta?: object) {
    super(C_IR_ERROR_TRANSLATIONS, code, null, meta);
  }
}
