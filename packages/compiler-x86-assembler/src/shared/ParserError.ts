import {CompilerError} from '@compiler/core/shared/CompilerError';
import {TokenLocation} from '@compiler/lexer/tokens';

export enum ParserErrorCode {
  SYNTAX_ERROR,
  INCORRECT_EXPRESSION,

  OPERAND_MUST_BE_NUMBER,
  OPERAND_SIZES_MISMATCH,

  MISSING_MEM_OPERAND_SIZE,
  INVALID_INSTRUCTION_OPERAND,
  UNKNOWN_OPERATION,
  REGISTER_IS_NOT_SEGMENT_REG,
  EXCEEDING_CASTED_NUMBER_SIZE,

  // other args
  INCORRECT_ARG_QUOTE_TEXT_LENGTH,

  // mem
  SCALE_IS_ALREADY_DEFINED,
  INCORRECT_SCALE,
  INCORRECT_MODRM,
  INCORRECT_MEM_EXPRESSION,
  DISPLACEMENT_EXCEEDING_BYTE_SIZE,
  SCALE_INDEX_IS_UNSUPPORTED_IN_MODE,

  // segmented mem
  INCORRECT_SEGMENTED_MEM_FORMAT,
  INCORRECT_SEGMENTED_MEM_ARGS_COUNT,

  INCORRECT_SEGMENT_MEM_ARG_SIZE,
  INCORRECT_OFFSET_MEM_ARG_SIZE,
  OFFSET_MEM_ARG_SIZE_EXCEEDING_SIZE,

  // prefixes
  INCORRECT_SREG_OVERRIDE,
  CONFLICT_SREG_OVERRIDE,

  // labels
  MISSING_PARENT_LABEL,
  UNKNOWN_LABEL,
  LABEL_ALREADY_DEFINED,
  EQU_ALREADY_DEFINED,
  USED_RESERVED_NAME,

  // critical expressions
  INCORRECT_TIMES_ARGS_COUNT,
  INCORRECT_TIMES_VALUE,
  MISSING_TIMES_REPEATED_INSTRUCTION,
  UNABLE_PARSE_REPEATED_INSTRUCTION,

  // compiler
  UNKNOWN_COMPILER_INSTRUCTION,
  UNSUPPORTED_COMPILER_MODE,
  UNKNOWN_BINARY_SCHEMA_DEF,
  MISSING_RM_BYTE_DEF,
  MISSING_MEM_ARG_DEF,
  MISSING_IMM_ARG_DEF,
  INVALID_ADDRESSING_MODE,
  UNMATCHED_SCHEMA_POSTPROCESS,
  UNABLE_TO_COMPILE_FILE,
  UNPERMITTED_NODE_IN_POSTPROCESS_MODE,
  INCORRECT_SLAVE_BLOBS,

  // define data
  DEFINED_DATA_EXCEEDES_BOUNDS,
  UNSUPPORTED_DEFINE_TOKEN,
  INCORRECT_FLOAT_SIZE,

  // equ
  INCORRECT_EQU_ARGS_COUNT,

  // options
  ORIGIN_REDEFINED,
}

/* eslint-disable max-len */
export const ERROR_TRANSLATIONS: Record<ParserErrorCode, string> = {
  [ParserErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [ParserErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',

  [ParserErrorCode.OPERAND_MUST_BE_NUMBER]: 'Operand must be number!',
  [ParserErrorCode.OPERAND_SIZES_MISMATCH]: 'Operand sizes mismatch!',

  [ParserErrorCode.MISSING_MEM_OPERAND_SIZE]: 'Missing mem operand size!',
  [ParserErrorCode.INVALID_INSTRUCTION_OPERAND]: 'Invalid operand "%{operand}"!',
  [ParserErrorCode.UNKNOWN_OPERATION]: 'Unknown operation "%{operation}"!',
  [ParserErrorCode.REGISTER_IS_NOT_SEGMENT_REG]: 'Provided register "%{reg}" is not segment register!',

  [ParserErrorCode.EXCEEDING_CASTED_NUMBER_SIZE]: 'Provided value "%{value}" is exceeding casted arg size (provided %{size} bytes but max is %{maxSize} bytes)!',

  // other args
  [ParserErrorCode.INCORRECT_ARG_QUOTE_TEXT_LENGTH]: 'Incorrect text "%{text}" length! It must be less than %{maxSize} bytes!',

  // mem
  [ParserErrorCode.SCALE_IS_ALREADY_DEFINED]: 'Scale is already defined!',
  [ParserErrorCode.INCORRECT_MEM_EXPRESSION]: 'Incorrect mem expression "%{expression}"!',
  [ParserErrorCode.INCORRECT_SCALE]: 'Incorrect scale! It must be 1, 2, 4 or 8 instead of "%{scale}"!',
  [ParserErrorCode.INCORRECT_MODRM]: 'Error during "%{phrase}" ModRM instruction byte parsing!',
  [ParserErrorCode.DISPLACEMENT_EXCEEDING_BYTE_SIZE]: 'Displacement of "%{address}" exceedes arg byte size (%{byteSize} bytes but should be <= %{maxSize} bytes)!',
  [ParserErrorCode.SCALE_INDEX_IS_UNSUPPORTED_IN_MODE]: 'Scale index is unsupported in this mode!',

  // segmented mem
  [ParserErrorCode.INCORRECT_SEGMENTED_MEM_FORMAT]: 'Incorrect segmented memory format "%{address}"!',
  [ParserErrorCode.INCORRECT_SEGMENTED_MEM_ARGS_COUNT]: 'Incorrect segmented memory address args count %{count}!',

  [ParserErrorCode.INCORRECT_SEGMENT_MEM_ARG_SIZE]: 'Incorrect address segment size, provided %{size} bytes but required is 2 bytes!',
  [ParserErrorCode.INCORRECT_OFFSET_MEM_ARG_SIZE]: 'Incorrect address offset size, provided %{size} bytes but required is <= 4 bytes!',
  [ParserErrorCode.OFFSET_MEM_ARG_SIZE_EXCEEDING_SIZE]: 'Incorrect address offset size, provided %{size} bytes but should be <= %{maxSize} bytes!',

  // prefixes
  [ParserErrorCode.INCORRECT_SREG_OVERRIDE]: 'Incorrect segment register override "%{sreg}"!',
  [ParserErrorCode.CONFLICT_SREG_OVERRIDE]: 'Conflict sreg override!',

  // critical expressions
  [ParserErrorCode.INCORRECT_TIMES_ARGS_COUNT]: 'Incorrect times expression args count!',
  [ParserErrorCode.INCORRECT_TIMES_VALUE]: 'Incorrect times expression value "%{times}"!',
  [ParserErrorCode.MISSING_TIMES_REPEATED_INSTRUCTION]: 'Missing times expression instruction!',
  [ParserErrorCode.UNABLE_PARSE_REPEATED_INSTRUCTION]: 'Unable to parse repeated instruction "%{expression}"!',

  // labels
  [ParserErrorCode.MISSING_PARENT_LABEL]: 'Unable to resolve local label "%{label}", missing parent label!',
  [ParserErrorCode.UNKNOWN_LABEL]: 'Unknown label "%{label}"!',
  [ParserErrorCode.LABEL_ALREADY_DEFINED]: 'Label "%{label}" is already defined!',
  [ParserErrorCode.EQU_ALREADY_DEFINED]: 'EQU "%{name}" is already defined!',
  [ParserErrorCode.USED_RESERVED_NAME]: 'Defined "%{name}" label name is reserved!',

  // compiler
  [ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION]: 'Unknown compile instruction "%{instruction}"!',
  [ParserErrorCode.UNSUPPORTED_COMPILER_MODE]: 'Unsupported compiler mode!',
  [ParserErrorCode.MISSING_RM_BYTE_DEF]: 'Missing RM byte arg definition but in binary schema is present!',
  [ParserErrorCode.MISSING_MEM_ARG_DEF]: 'Missing mem arg definition but in binary schema is present!',
  [ParserErrorCode.MISSING_IMM_ARG_DEF]: 'Missing imm arg definition but in binary schema is present!',
  [ParserErrorCode.UNKNOWN_BINARY_SCHEMA_DEF]: 'Unknown binary schema token %{schema}',
  [ParserErrorCode.INVALID_ADDRESSING_MODE]: 'Invalid address!',
  [ParserErrorCode.UNMATCHED_SCHEMA_POSTPROCESS]: 'Cannot find instruction "%{instruction}"!',
  [ParserErrorCode.UNABLE_TO_COMPILE_FILE]: 'Unable to compile file!',
  [ParserErrorCode.UNPERMITTED_NODE_IN_POSTPROCESS_MODE]: 'Unpermitted node "%{node}" in compiler first pass mode!',
  [ParserErrorCode.INCORRECT_SLAVE_BLOBS]: 'Incorrect slave blobs!',

  // defined data
  [ParserErrorCode.DEFINED_DATA_EXCEEDES_BOUNDS]: 'Defined data "%{data}" excedees bounds (%{maxSize} bytes)!',
  [ParserErrorCode.UNSUPPORTED_DEFINE_TOKEN]: 'Invalid "%{token}" define token value!',
  [ParserErrorCode.INCORRECT_FLOAT_SIZE]: 'Incorrect float "%{number}" size!',

  // equ
  [ParserErrorCode.INCORRECT_EQU_ARGS_COUNT]: 'Incorrect equ args count, provided %{count} but required is 1!',

  // options
  [ParserErrorCode.ORIGIN_REDEFINED]: 'Origin redefined!',
};

/**
 * Error thrown durin lexer phase!
 *
 * @export
 * @class LexerError
 * @extends {CompilerError<ParserErrorCode, TokenLocation>}
 */
export class ParserError extends CompilerError<ParserErrorCode, TokenLocation> {
  constructor(code: ParserErrorCode, loc?: TokenLocation, meta?: object) {
    super(ERROR_TRANSLATIONS, code, loc, meta);
  }
}
