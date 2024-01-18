import { CompilerError, fixme } from '@ts-c-compiler/core';
import { TokenLocation } from '@ts-c-compiler/lexer';

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
  REDEFINITION_OF_UNION_ENTRY,
  REDEFINITION_OF_ENUM_ENTRY,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
  UNKNOWN_DECLARATOR_ENTRY_TYPE,
  UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND,
  UNKNOWN_TYPE,
  UNKNOWN_CONSTANT_TYPE,
  UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
  UNKNOWN_STRUCT_LIKE_MEMBER,
  UNKNOWN_FUNCTION_CALL,
  UNKNOWN_INITIALIZER_TYPE,
  INCORRECT_INITIALIZED_VARIABLE_TYPE,
  INCOMPLETE_ARRAY_SIZE,
  EXCESS_ELEMENTS_IN_SCALAR_INITIALIZER,
  EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER,
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
  ASSIGNMENT_TO_CONST,
  OPERATOR_SIDES_TYPES_MISMATCH,
  REDEFINITION_OF_COMPILE_CONSTANT,
  INVALID_INITIALIZER,
  UNKNOWN_INITIALIZER_VALUE_TYPE,
  INCORRECT_NAMED_STRUCTURE_INITIALIZER_USAGE,
  INCORRECT_INDEX_INITIALIZER_USAGE,
  UNKNOWN_NAMED_STRUCTURE_INITIALIZER,
  INDEX_INITIALIZER_ARRAY_OVERFLOW,
  UNKNOWN_IDENTIFIER,
  WRONG_NON_STRUCT_FIELD_ACCESS,
  WRONG_NON_ARRAY_FIELD_ACCESS,
  WRONG_POINTER_MATH_OPERATOR,
  INCORRECT_POINTER_SIDES_TYPES,
  PROVIDED_TYPE_MUST_BE_POINTER,
  UNABLE_EVAL_CONST_EXPRESSION,
  MATH_EXPRESSION_MUST_BE_INTEGRAL_TYPE,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<
  CTypeCheckErrorCode,
  string
> = {
  [CTypeCheckErrorCode.TYPECHECK_ERROR]: 'Typecheck error!',
  [CTypeCheckErrorCode.EXPECTED_RECEIVE_TYPE]:
    'Expected to receive type %{expected} but received %{received}!',
  [CTypeCheckErrorCode.INVALID_ARRAY_SIZE]: 'Invalid array size!',
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]:
    'Wrong specifiers used with void!',
  [CTypeCheckErrorCode.REDEFINITION_OF_TYPE]: 'Redefinition of type %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE]:
    'Redefinition of variable %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY]:
    'Redefinition of struct entry %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_UNION_ENTRY]:
    'Redefinition of union entry %{name}!',
  [CTypeCheckErrorCode.REDEFINITION_OF_ENUM_ENTRY]:
    'Redefinition of enum entry %{name}!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR]:
    'Incorrect constant expression!',
  [CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER]:
    'Incorrect constant expression identifier!',
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE]: fixme(
    'Unable to extract struct type!',
  ),
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE]: fixme(
    'Unable to extract declaration type!',
  ),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER]: fixme(
    'Unknown declarator entry identifier!',
  ),
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_TYPE]: fixme(
    'Unknown declarator entry type!',
  ),
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_EXPR_EVAL_OPERAND]: fixme(
    'Unknown constant expression operand!',
  ),
  [CTypeCheckErrorCode.UNKNOWN_TYPE]: 'Unknown type named "%{typeName}"!',
  [CTypeCheckErrorCode.UNKNOWN_CONSTANT_TYPE]:
    'Unknown type of "%{text}" constant!',
  [CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE]:
    'Unknown left side dot expression type!',
  [CTypeCheckErrorCode.UNKNOWN_STRUCT_LIKE_MEMBER]:
    'Unknown %{typeName} type "%{fieldName}" member!',
  [CTypeCheckErrorCode.UNKNOWN_FUNCTION_CALL]: 'Unknown function "%{name}"!',
  [CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE]: 'Unknown initializer type!',
  [CTypeCheckErrorCode.UNKNOWN_IDENTIFIER]: 'Unknown identifier "%{name}"!',
  [CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE]:
    'Unable assign "%{sourceType}" initializer value to "%{destinationType}"!',
  [CTypeCheckErrorCode.INCOMPLETE_ARRAY_SIZE]:
    'Incomplete array size "%{typeName}"!',
  [CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_SCALAR_INITIALIZER]:
    'Excess elements in scalar initializer!',
  [CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER]:
    'Excess elements in array initializer!',
  [CTypeCheckErrorCode.INVALID_INITIALIZER]: 'Invalid initializer!',
  [CTypeCheckErrorCode.RETURN_STMT_OUTSIDE_FUNCTION]:
    'Return stmt should be placed in function definition!',
  [CTypeCheckErrorCode.CAST_TO_NON_SCALAR_TYPE]:
    // eslint-disable-next-line max-len
    'Cast to non-scalar type "%{typeName}"! Casting to non scalar type (such as array, struct) is not possible!',
  [CTypeCheckErrorCode.UNABLE_CAST_TO_SCALAR_TYPE]:
    'Cast to scalar type "%{sourceType}" to "%{destinationType}" is not possible!',
  [CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION]:
    'Too many args passed to function "%{typeName}"!',
  [CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION]:
    'Wrong args count passed to function "%{typeName}"! Expected "%{expected}" but received "%{received}"!',
  [CTypeCheckErrorCode.WRONG_ARG_PASSED_TO_FUNCTION]:
    'Wrong #%{index} arg passed to function "%{typeName}"! Expected "%{expected}" but received "%{received}"!',
  [CTypeCheckErrorCode.CALLED_OBJECT_IS_NOT_FUNCTION]:
    'Called object of type "%{typeName}" is not a function!',
  [CTypeCheckErrorCode.RETURN_EXPRESSION_WRONG_TYPE]:
    'Return expression has wrong type! Expected: "%{expected}" but received "%{received}"!',
  [CTypeCheckErrorCode.PROVIDED_TYPE_DOES_NOT_CONTAIN_PROPERTIES]:
    'Provided %{typeName} does not contain members!',
  [CTypeCheckErrorCode.ASSIGNMENT_EXPRESSION_TYPES_MISMATCH]:
    'Assignment expression types mismatch! Unable assign "%{right}" to "%{left}"!',
  [CTypeCheckErrorCode.ASSIGNMENT_TO_CONST]:
    'Assignment to read-only type "%{left}"!',
  [CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH]:
    'Operator types mismatch! Left side type "%{left}" mismatch with right side "%{right}"!',
  [CTypeCheckErrorCode.MATH_EXPRESSION_MUST_BE_INTEGRAL_TYPE]:
    // eslint-disable-next-line max-len
    'Expression must be integral type! Left side type "%{left}" mismatch with right side "%{right}"! Try casting variable.',
  [CTypeCheckErrorCode.REDEFINITION_OF_COMPILE_CONSTANT]:
    'Redefinition of compile type constant "%{name}"!',
  [CTypeCheckErrorCode.UNKNOWN_INITIALIZER_VALUE_TYPE]:
    'Unknown initializer value type!',
  [CTypeCheckErrorCode.INCORRECT_NAMED_STRUCTURE_INITIALIZER_USAGE]:
    'Incorrect named structure initializer usage!',
  [CTypeCheckErrorCode.INCORRECT_INDEX_INITIALIZER_USAGE]:
    'Incorrect index initializer usage!',
  [CTypeCheckErrorCode.UNKNOWN_NAMED_STRUCTURE_INITIALIZER]:
    'Unknown named structure field initializer "%{name}"!',
  [CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW]:
    'Index initializer array overflow!',
  [CTypeCheckErrorCode.WRONG_NON_STRUCT_FIELD_ACCESS]:
    'Wrong non struct field access "%{typeName}"!',
  [CTypeCheckErrorCode.WRONG_NON_ARRAY_FIELD_ACCESS]:
    'Wrong non array field access "%{typeName}"!',
  [CTypeCheckErrorCode.WRONG_POINTER_MATH_OPERATOR]:
    'Cannot perform "%{operator}" operation on pointer type!',
  [CTypeCheckErrorCode.INCORRECT_POINTER_SIDES_TYPES]:
    'Incorrect pointer operator types! Cannot perform "%{operator}" operation between "%{left}" and "%{right}"!',
  [CTypeCheckErrorCode.PROVIDED_TYPE_MUST_BE_POINTER]:
    'Provided type must be pointer "%{typeName}"!',
  [CTypeCheckErrorCode.UNABLE_EVAL_CONST_EXPRESSION]:
    'Unable eval constant expression!',
};

/**
 * Error thrown during AST generation phase
 */
export class CTypeCheckError extends CompilerError<
  CTypeCheckErrorCode,
  TokenLocation
> {
  constructor(code: CTypeCheckErrorCode, loc?: TokenLocation, meta?: object) {
    super(C_TYPE_CHECK_ERROR_TRANSLATIONS, code, loc, meta);
  }
}
