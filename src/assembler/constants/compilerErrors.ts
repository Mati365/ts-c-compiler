export enum ParserErrorCode {
  UNKNOWN_TOKEN,
  SYNTAX_ERROR,
  INCORRECT_EXPRESSION,

  OPERAND_MUST_BE_NUMBER,
  MISSING_MEM_OPERAND_SIZE,
  INVALID_INSTRUCTION_OPERAND,
  UNKNOWN_OPERATION,
  REGISTER_IS_NOT_SEGMENT_REG,

  // mem
  INCORRECT_OPERAND,
  MISSING_MUL_SECOND_ARG,
  SCALE_IS_ALREADY_DEFINED,
  INCORRECT_SCALE_MEM_PARAMS,
  INCORRECT_SCALE,
  UNKNOWN_MEM_TOKEN,
}
