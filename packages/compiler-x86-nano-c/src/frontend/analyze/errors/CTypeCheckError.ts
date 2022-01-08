import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/shared';

export function fixme(str: string) {
  return `[[ fixme ]] ${str}`;
}

export enum CTypeCheckErrorCode {
  TYPECHECK_ERROR,
  EXPECTED_RECEIVE_TYPE,
  INVALID_ARRAY_SIZE,
  UNKNOWN_SPECIFIERS_KEYWORD,
  UNKNOWN_QUALIFIERS_KEYWORD,
  INCORRECT_VOID_SPECIFIERS,
  INCORRECT_TYPE_SPECIFIERS,
  INCORRECT_CONSTANT_EXPR,
  INCORRECT_CONSTANT_EXPR_IDENTIFIER,
  REDEFINITION_OF_TYPE,
  REDEFINITION_OF_VARIABLE,
  REDEFINITION_OF_STRUCT_ENTRY,
  REDEFINITION_OF_ENUM_ENTRY,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
  UNKNOWN_DECLARATOR_ENTRY_TYPE,
  UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND,
  UNKNOWN_TYPE,
  UNKNOWN_CONSTANT_TYPE,
  UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
  UNKNOWN_STRUCT_LIKE_MEMBER,
  UNKNOWN_INITIALIZER_TYPE,
  UNKNOWN_FUNCTION_CALL,
  UNABLE_TO_EXTRACT_DECLARATION_TYPE,
  RETURN_STMT_OUTSIDE_FUNCTION,
  CAST_TO_NON_SCALAR_TYPE,
  UNABLE_CAST_TO_SCALAR_TYPE,
  TOO_MANY_ARGS_PASSED_TO_FUNCTION,
  WRONG_ARGS_COUNT_PASSED_TO_FUNCTION,
  WRONG_ARG_PASSED_TO_FUNCTION,
  CALLED_OBJECT_IS_NOT_FUNCTION,
  RETURN_EXPRESSION_WRONG_TYPE,
  PROVIDED_TYPE_DOES_NOT_CONTAIN_PROPERTIES,
  ASSIGNMENT_EXPRESSION_TYPES_MISMATCH,
  INITIALIZER_SIDES_TYPES_MISMATCH,
  OPERATOR_SIDES_TYPES_MISMATCH,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<CTypeCheckErrorCode, string> = {
  [CTypeCheckErrorCode.TYPECHECK_ERROR]: 'Typecheck error!',
  [CTypeCheckErrorCode.EXPECTED_RECEIVE_TYPE]: 'Expected to receive type %{expected} but received %{received}!',
  [CTypeCheckErrorCode.INVALID_ARRAY_SIZE]: 'Invalid array size!',
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]: 'Wrong specifiers used with void!',
  [CTypeCheckErrorCode.REDEFINITION_OF_TYPE]: 'Redefinition of type %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE]: 'Redefinition of variable %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY]: 'Redefinition of struct entry %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_ENUM_ENTRY]: 'Redefinition of enum entry %{name}!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR]: 'Incorrect constant expression!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER]: 'Incorrect constant expression identifier!',
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE]: fixme('Unable to extract struct type!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER]: fixme('Unknown declarator entry identifier!'),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_TYPE]: fixme('Unknown declarator entry type!'),
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND]: fixme('Unknown constant expression operand!'),
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE]: fixme('Unable to extract declaration type!'),
  [CTypeCheckErrorCode.UNKNOWN_TYPE]: 'Unknown type named "%{typeName}"!',
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_TYPE]: 'Unknown type of "%{text}" constant!',
  [CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE]: 'Unknown left side dot expression type!',
  [CTypeCheckErrorCode.UNKNOWN_STRUCT_LIKE_MEMBER]: 'Unknown %{typeName} type "%{fieldName}" member!',
  [CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE]: 'Unknown initializer type!',
  [CTypeCheckErrorCode.UNKNOWN_FUNCTION_CALL]: 'Unknown function call!',
  [CTypeCheckErrorCode.RETURN_STMT_OUTSIDE_FUNCTION]: 'Return stmt should be placed in function definition!',
  [CTypeCheckErrorCode.CAST_TO_NON_SCALAR_TYPE]: (
    // eslint-disable-next-line max-len
    'Cast to non-scalar type "%{typeName}"! Casting to non scalar type (such as array, struct) is not possible!'
  ),
  [CTypeCheckErrorCode.UNABLE_CAST_TO_SCALAR_TYPE]: (
    'Cast to scalar type "%{sourceType}" to "%{destinationType}" is not possible!'
  ),
  [CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION]: (
    'Too many args passed to function "%{typeName}"!'
  ),
  [CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION]: (
    'Wrong args count passed to function "%{typeName}"! Expected "%{expected}" but received "%{received}"!'
  ),
  [CTypeCheckErrorCode.WRONG_ARG_PASSED_TO_FUNCTION]: (
    'Wrong #%{index} arg passed to function "%{typeName}"! Expected "%{expected}" but received "%{received}"!'
  ),
  [CTypeCheckErrorCode.CALLED_OBJECT_IS_NOT_FUNCTION]: (
    'Called object of type "%{typeName}" is not a function!'
  ),
  [CTypeCheckErrorCode.RETURN_EXPRESSION_WRONG_TYPE]: (
    'Return expression has wrong type! Expected: "%{expected}" but received "%{received}"!'
  ),
  [CTypeCheckErrorCode.PROVIDED_TYPE_DOES_NOT_CONTAIN_PROPERTIES]: (
    'Provided %{typeName} does not contain members!'
  ),
  [CTypeCheckErrorCode.ASSIGNMENT_EXPRESSION_TYPES_MISMATCH]: (
    'Assignment expression types mismatch! Unable assign "%{right}" to "%{left}"!'
  ),
  [CTypeCheckErrorCode.INITIALIZER_SIDES_TYPES_MISMATCH]: (
    'Initializer types mismatch! Left side type "%{left}" mismatch with right side type "%{right}"!'
  ),
  [CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH]: (
    'Operator types mismatch! Left side type "%{left}" mismatch with right side "%{right}"!'
  ),
};

/**
 * Error thrown during AST generation phase
 *
 * @export
 * @class CTypeCheckError
 * @extends {CompilerError<CTypeCheckErrorCode, TokenLocation>}
 */
export class CTypeCheckError extends CompilerError<CTypeCheckErrorCode, TokenLocation> {
  constructor(code: CTypeCheckErrorCode, loc?: TokenLocation, meta?: object) {
    super(C_TYPE_CHECK_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
