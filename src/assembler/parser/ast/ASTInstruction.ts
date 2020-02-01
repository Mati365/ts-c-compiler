import * as R from 'ramda';

import {Register, COMPILER_REGISTERS_SET} from '../../constants';
import {
  InstructionArgType,
  InstructionSchema,
  COMPILER_INSTRUCTIONS_SET,
} from '../../constants/instructionSetSchema';

import {ASTParser} from './ASTParser';
import {
  KindASTNode,
  ASTNodeLocation,
} from './ASTNode';

import {
  TokenType,
  Token,
  NumberToken,
} from '../lexer/tokens';

type ASTInstructionArgValue = string|number|Register;

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
class ASTInstructionArg {
  public type: InstructionArgType;
  public value: ASTInstructionArgValue;
  public byteSize: number;

  constructor(
    type: InstructionArgType,
    value: ASTInstructionArgValue,
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

    this.args = args;
    this.schema = schema;
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
      // register might be also number token (for example AH, Bh etc.)
      // so do not check token type in this case
      const register = COMPILER_REGISTERS_SET[token.text];
      if (register)
        return new ASTInstructionArg(InstructionArgType.REGISTER, register, register.byteSize);

      // try to check if it is number
      // check number size to perform better instruction matching
      if (token.type === TokenType.NUMBER) {
        const {number, byteSize} = (<NumberToken> token).value;

        return new ASTInstructionArg(InstructionArgType.NUMBER, number, byteSize);
      }

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
