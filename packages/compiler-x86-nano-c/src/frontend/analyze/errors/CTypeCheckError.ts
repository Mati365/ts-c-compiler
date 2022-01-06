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
  REDEFINITION_OF_FUNCTION,
  REDEFINITION_OF_VARIABLE,
  REDEFINITION_OF_STRUCT_ENTRY,
  REDEFINITION_OF_ENUM_ENTRY,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
  UNKNOWN_DECLARATOR_ENTRY_TYPE,
  UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND,
  UNKNOWN_EXPR_TYPE,
  UNKNOWN_TYPE,
  UNKNOWN_CONSTANT_TYPE,
  UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
  UNKNOWN_STRUCT_LIKE_MEMBER,
  UNKNOWN_INITIALIZER_TYPE,
  UNABLE_TO_EXTRACT_DECLARATION_TYPE,
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
  [CTypeCheckErrorCode.REDEFINITION_OF_FUNCTION]: 'Redefinition of function %{name}!',
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
  [CTypeCheckErrorCode.UNKNOWN_EXPR_TYPE]: 'Unknown expression type!',
  [CTypeCheckErrorCode.UNKNOWN_TYPE]: 'Unknown type named "%{typeName}"!',
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_TYPE]: 'Unknown type of "%{text}" constant!',
  [CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE]: 'Unknown left side dot expression type!',
  [CTypeCheckErrorCode.UNKNOWN_STRUCT_LIKE_MEMBER]: 'Unknown %{typeName} type "%{fieldName}" member!',
  [CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE]: 'Unknown initializer type!',
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
