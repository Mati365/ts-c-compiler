import * as R from 'ramda';

import {COMPILER_INSTRUCTIONS_SET} from '../../../constants/instructionSetSchema';

import {InstructionPrefixesBitset} from '../../../constants';
import {InstructionArgType} from '../../../types';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';
import {ASTParser} from '../ASTParser';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionSchema} from './ASTInstructionSchema';
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

import {findMatchingOpcode} from './ASTInstructionArgMatchers';

export const AST_INSTRUCTION = 'Instruction';

/**
 * Parser for:
 * [opcode] [arg1] [arg2] [argX]
 *
 * @export
 * @class ASTInstruction
 * @extends {KindASTNode('Instruction')}
 */
export class ASTInstruction extends KindASTNode(AST_INSTRUCTION) {
  constructor(
    public readonly schema: ASTInstructionSchema,
    public readonly args: ASTInstructionArg[],
    public readonly prefixes: number = 0x0,
    loc: ASTNodeLocation,
  ) {
    super(loc);
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
        if (result) {
          if (acc.length && result.byteSize !== acc[acc.length - 1].byteSize)
            throw new ParserError(ParserErrorCode.OPERAND_SIZES_MISMATCH);

          acc.push(result);
        }

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
    // if not opcode, ignore
    const opcode = <string> token.text;
    if (token.type !== TokenType.KEYWORD || !COMPILER_INSTRUCTIONS_SET[opcode])
      return null;

    // match prefixes
    /* eslint-disable no-constant-condition */
    let prefixes = 0x0;
    do {
      const prefix = InstructionPrefixesBitset[R.toUpper(<string> token.text)];
      if (!prefix)
        break;

      prefixes |= prefix;
      token = parser.fetchRelativeToken();
    } while (true);
    /* eslint-enable no-constant-condition */

    // parse arguments
    const argsTokens = [];
    let commaToken = null;

    do {
      // value or size operand
      const op1 = parser.fetchRelativeToken();
      argsTokens.push(op1);

      // if it was size operand - fetch next token which is prefixed
      if (op1.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
        argsTokens.push(
          parser.fetchRelativeToken(),
        );
      }

      // comma
      commaToken = parser.fetchRelativeToken();
    } while (commaToken?.type === TokenType.COMMA);

    // decode instructions
    const args = ASTInstruction.parseInstructionArgsTokens(argsTokens);

    // find matching schema
    const schema = findMatchingOpcode(COMPILER_INSTRUCTIONS_SET, opcode, args);
    if (!schema)
      return null;

    return new ASTInstruction(
      schema,
      ASTInstruction.parseInstructionArgsTokens(argsTokens),
      prefixes,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
