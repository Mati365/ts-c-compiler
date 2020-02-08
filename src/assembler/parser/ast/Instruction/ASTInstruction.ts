import * as R from 'ramda';

import {COMPILER_INSTRUCTIONS_SET} from '../../../constants/instructionSetSchema';

import {InstructionPrefixesBitset} from '../../../constants';
import {InstructionSchema} from '../../../types/InstructionSchema';
import {InstructionArgType} from '../../../types/InstructionArg';

import {ParserError, ParserErrorCode} from '../../../types/ParserError';
import {ASTParser} from '../ASTParser';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionMemArg} from './ASTInstructionMemArg';

import {
  KindASTNode,
  ASTNodeLocation,
} from '../ASTNode';

import {
  TokenType,
  Token,
  NumberToken,
  RegisterToken,
  TokenKind,
  SizeOverrideToken,
} from '../../lexer/tokens';

/**
 * Parser for:
 * [opcode] [arg1] [arg2] [argX]
 *
 * @export
 * @class ASTInstruction
 * @extends {KindASTNode('Instruction')}
 */
export class ASTInstruction extends KindASTNode('Instruction') {
  public schema: InstructionSchema;
  public args: ASTInstructionArg[];
  public prefixes: number;

  constructor(
    schema: InstructionSchema,
    args: ASTInstructionArg[],
    loc: ASTNodeLocation,
    prefixes: number = 0x0,
  ) {
    super(loc);

    this.schema = schema;
    this.args = args;
    this.prefixes = prefixes;
  }

  /**
   * Transforms list of tokens into arguments
   *
   * @static
   * @param {Token[]} tokens
   * @returns {ASTInstructionArg[]}
   * @memberof ASTInstruction
   */
  static parseInstructionArgsTokens(tokens: Token[]): ASTInstructionArg[] {
    let byteSizeOverride: number = null;
    const parseToken = (token: Token): ASTInstructionArg => {
      switch (token.type) {
        // Registers
        case TokenType.KEYWORD:
          if (token.kind === TokenKind.REGISTER) {
            const {schema, byteSize} = (<RegisterToken> token).value;

            return new ASTInstructionArg(
              InstructionArgType.REGISTER,
              schema,
              byteSizeOverride ?? byteSize,
            );
          }

          if (token.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
            byteSizeOverride = (<SizeOverrideToken> token).value.byteSize;
            return null;
          }

          break;

        // Numeric
        case TokenType.NUMBER: {
          const {number, byteSize} = (<NumberToken> token).value;

          return new ASTInstructionArg(
            InstructionArgType.NUMBER,
            number,
            byteSizeOverride ?? byteSize,
          );
        }

        // Mem address
        case TokenType.BRACKET:
          if (token.kind === TokenKind.SQUARE_BRACKET) {
            if (R.isNil(byteSizeOverride))
              throw new ParserError(ParserErrorCode.MISSING_MEM_OPERAND_SIZE);

            return new ASTInstructionMemArg(<string> token.text, byteSizeOverride);
          }
          break;

        default:
      }

      // force throw error if not known format
      throw new ParserError(
        ParserErrorCode.INVALID_INSTRUCTION_OPERAND,
        token.loc,
        {
          operand: token.text,
        },
      );
    };

    // a bit faster than transduce
    return R.reduce(
      (acc: ASTInstructionArg[], item: Token) => {
        const result = parseToken(item);
        if (result)
          acc.push(result);

        return acc;
      },
      <ASTInstructionArg[]> [],
      tokens,
    );
  }

  /**
   * Returns instruction
   *
   * @static
   * @param {Token} token
   * @param {Object} recursiveParseParams
   *
   * @returns ASTInstruction
   * @memberof ASTInstruction
   */
  static parse(token: Token, parser: ASTParser): ASTInstruction {
    if (token.type !== TokenType.KEYWORD)
      return null;

    // match prefixes
    /* eslint-disable no-constant-condition */
    let prefixes = 0x0;
    do {
      const prefix = InstructionPrefixesBitset[R.toUpper(<string> token.text)];
      if (!prefix)
        break;

      prefixes |= prefix;
      token = parser.fetchNextToken();
    } while (true);
    /* eslint-enable no-constant-condition */

    // match mnemonic
    const schema = COMPILER_INSTRUCTIONS_SET[token.text];
    if (!schema)
      return null;

    // parse arguments
    const argsTokens = [];
    let commaToken = null;

    do {
      // value or size operand
      const op1 = parser.fetchNextToken();
      argsTokens.push(op1);

      // if it was size operand - fetch next token which is prefixed
      if (op1.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
        argsTokens.push(
          parser.fetchNextToken(),
        );
      }

      // comma
      commaToken = parser.fetchNextToken();
    } while (commaToken?.type === TokenType.COMMA);

    // find matching instruction schema
    return new ASTInstruction(
      schema[0],
      ASTInstruction.parseInstructionArgsTokens(argsTokens),
      new ASTNodeLocation(token.loc, token.loc),
      prefixes,
    );
  }
}
