import {format} from '../utils/format';

import {ASTNodeLocation} from '../parser/ast/ASTNode';
import {TokenLocation} from '../parser/lexer/tokens';

export enum ParserErrorCode {
  UNKNOWN_TOKEN,
  SYNTAX_ERROR,
  INCORRECT_EXPRESSION,

  OPERAND_MUST_BE_NUMBER,
  OPERAND_SIZES_MISMATCH,

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
  INCORRECT_MODRM,

  // labels
  MISSING_PARENT_LABEL,

  // compiler
  UNKNOWN_COMPILER_INSTRUCTION,
  UNSUPPORTED_COMPILER_MODE,
  UNKNOWN_BINARY_SCHEMA_DEF,
  MISSING_RM_BYTE_DEF,
  MISSING_MEM_ARG_DEF,
  MISSING_IMM_ARG_DEF,
  INVALID_ADDRESSING_MODE,
}

export const ERROR_TRANSLATIONS: {[key in ParserErrorCode]: string} = {
  [ParserErrorCode.UNKNOWN_TOKEN]: 'Unknown token "%{token}"!',
  [ParserErrorCode.SYNTAX_ERROR]: 'Syntax error!',
  [ParserErrorCode.INCORRECT_EXPRESSION]: 'Incorrect expression!',

  [ParserErrorCode.OPERAND_MUST_BE_NUMBER]: 'Operand must be number!',
  [ParserErrorCode.OPERAND_SIZES_MISMATCH]: 'Operand sizes mismatch!',

  [ParserErrorCode.MISSING_MEM_OPERAND_SIZE]: 'Missing mem operand size!',
  [ParserErrorCode.INVALID_INSTRUCTION_OPERAND]: 'Invalid operand "%{operand}"!',
  [ParserErrorCode.UNKNOWN_OPERATION]: 'Unknown operation!',
  [ParserErrorCode.REGISTER_IS_NOT_SEGMENT_REG]: 'Provided register "%{reg}" is not segment register!',

  // mem
  [ParserErrorCode.UNKNOWN_MEM_TOKEN]: 'Unknown mem definition token %{token}!',
  [ParserErrorCode.INCORRECT_OPERAND]: 'Incorrect operand!',
  [ParserErrorCode.MISSING_MUL_SECOND_ARG]: 'Missing mul second arg!',
  [ParserErrorCode.SCALE_IS_ALREADY_DEFINED]: 'Scale is already defined!',
  [ParserErrorCode.INCORRECT_SCALE_MEM_PARAMS]: 'Incorrect scale mem params!',
  [ParserErrorCode.INCORRECT_SCALE]: 'Incorrect scale! It must be 1, 2, 4 or 8 instead of "%{scale}"!',
  [ParserErrorCode.INCORRECT_MODRM]: 'Error during "%{phrase}" ModRM instruction byte parsing!',

  // labels
  [ParserErrorCode.MISSING_PARENT_LABEL]: 'Unable to resolve local label %{label}, missing parent label!',

  // compiler
  [ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION]: 'Unknown compile token "%{instruction}"!',
  [ParserErrorCode.UNSUPPORTED_COMPILER_MODE]: 'Unsupported compiler mode!',
  [ParserErrorCode.MISSING_RM_BYTE_DEF]: 'Missing RM byte arg definition but in binary schema is present!',
  [ParserErrorCode.MISSING_MEM_ARG_DEF]: 'Missing mem arg definition but in binary schema is present!',
  [ParserErrorCode.MISSING_IMM_ARG_DEF]: 'Missing imm arg definition but in binary schema is present!',
  [ParserErrorCode.UNKNOWN_BINARY_SCHEMA_DEF]: 'Unknown binary schema token %{schema}',
  [ParserErrorCode.INVALID_ADDRESSING_MODE]: 'Invalid addressing mode!',
};

/**
 * Errors thrown during compiling
 *
 * @export
 * @class ParserError
 */
export class ParserError extends Error {
  public readonly loc: ASTNodeLocation;

  constructor(
    public readonly code: ParserErrorCode,
    loc?: TokenLocation|ASTNodeLocation,
    public readonly meta?: object,
  ) {
    super();

    this.loc = (
      loc instanceof TokenLocation
        ? ASTNodeLocation.fromTokenLoc(loc)
        : loc
    );

    this.name = 'ParserError';
    this.message = format(ERROR_TRANSLATIONS[code], meta || {});

    if (this.loc)
      this.message = `${this.loc.start.toString()}: ${this.message}`;
  }

  static throw(
    code: ParserErrorCode,
    loc?: TokenLocation|ASTNodeLocation,
    meta?: object,
  ) {
    throw new ParserError(code, loc, meta);
  }
}
