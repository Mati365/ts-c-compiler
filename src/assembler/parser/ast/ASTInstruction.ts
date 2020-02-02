import * as R from 'ramda';

import {COMPILER_INSTRUCTIONS_SET} from '../../constants/instructionSetSchema';
import {lexer} from '../lexer/lexer';

import {InstructionSchema} from '../../types/InstructionSchema';
import {
  InstructionArgValue,
  InstructionArgType,
  MemAddressDescription,
} from '../../types/InstructionArg';

import {ASTParser} from './ASTParser';
import {
  KindASTNode,
  ASTNodeLocation,
} from './ASTNode';

import {
  TokenType,
  Token,
  NumberToken,
  RegisterToken,
  TokenKind,
} from '../lexer/tokens';

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
class ASTInstructionArg {
  public type: InstructionArgType;
  public value: InstructionArgValue;
  public byteSize: number;

  constructor(
    type: InstructionArgType,
    value: InstructionArgValue,
    byteSize: number = 1,
  ) {
    this.type = type;
    this.value = value;
    this.byteSize = byteSize;
  }
}

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

  constructor(
    schema: InstructionSchema,
    args: ASTInstructionArg[],
    loc: ASTNodeLocation,
  ) {
    super(loc);

    this.schema = schema;
    this.args = args;
  }

  /**
   * Resolves from string expression instruction address
   *
   * @static
   * @param {string} expression
   * @returns {MemAddressDescription}
   * @memberof ASTInstruction
   */
  static parseInstructionMemExpression(expression: string): MemAddressDescription {
    console.log(Array.from(lexer(expression)));

    return {};
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
    const parseToken = (token: Token): ASTInstructionArg => {
      switch (token.type) {
        // Registers
        case TokenType.KEYWORD:
          if (token.kind === TokenKind.REGISTER) {
            const {schema, byteSize} = (<RegisterToken> token).value;

            return new ASTInstructionArg(InstructionArgType.REGISTER, schema, byteSize);
          }
          break;

        // Numeric
        case TokenType.NUMBER: {
          const {number, byteSize} = (<NumberToken> token).value;

          return new ASTInstructionArg(InstructionArgType.NUMBER, number, byteSize);
        }

        // Mem address
        case TokenType.BRACKET:
          if (token.kind === TokenKind.SQUARE_BRACKET) {
            return new ASTInstructionArg(
              InstructionArgType.MEMORY,
              ASTInstruction.parseInstructionMemExpression(<string> token.text),
              null,
            );
          }
          break;

        default:
      }

      // force throw error if not known format
      throw new Error(`Invalid instruction operand ${token.text}(${token.type})!`);
    };

    return R.map(parseToken, tokens);
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

    const schema = COMPILER_INSTRUCTIONS_SET[token.text];
    if (!schema)
      return null;

    // parse arguments
    const argsTokens = [];
    let commaToken = null;

    do {
      // value
      argsTokens.push(
        parser.fetchNextToken(),
      );

      // comma
      commaToken = parser.fetchNextToken();
    } while (commaToken?.type === TokenType.COMMA);

    // find matching instruction schema
    return new ASTInstruction(
      schema[0],
      ASTInstruction.parseInstructionArgsTokens(argsTokens),
      new ASTNodeLocation(token.loc, token.loc),
    );
  }
}
