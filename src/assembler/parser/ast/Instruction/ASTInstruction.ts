import * as R from 'ramda';

import {COMPILER_INSTRUCTIONS_SET} from '../../../constants/instructionSetSchema';

import {InstructionPrefixesBitset} from '../../../constants';
import {InstructionArgType} from '../../../types';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';
import {ASTParser} from '../ASTParser';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionSchema} from './ASTInstructionSchema';
import {ASTInstructionMemArg} from './ASTInstructionMemArg';
import {ASTNodeKind} from '../types';

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

/**
 * Used in string serializers
 *
 * @export
 * @param {string} prefix
 * @param {any[]} args
 * @returns {string}
 */
export function toStringArgsList(prefix: string, args: any[]): string {
  const formattedArgs = R.map(
    R.toString,
    args,
  );

  return R.toLower(`${prefix} ${R.join(', ', formattedArgs)}`);
}

/**
 * Fetches array of args such as:
 * ax, 0x55, byte ax
 *
 * @export
 * @param {ASTParser} parser
 * @param {boolean} [allowSizeOverride=true]
 * @returns {Token[]}
 */
export function fetchTokensArgsList(
  parser: ASTParser,
  allowSizeOverride: boolean = true,
): Token[] {
  // parse arguments
  const argsTokens: Token[] = [];
  let commaToken = null;

  do {
    // value or size operand
    const op1 = parser.fetchRelativeToken();
    argsTokens.push(op1);

    // if it was size operand - fetch next token which is prefixed
    if (allowSizeOverride && op1.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
      argsTokens.push(
        parser.fetchRelativeToken(),
      );
    }

    // comma
    commaToken = parser.fetchRelativeToken();
  } while (commaToken?.type === TokenType.COMMA);

  return argsTokens;
}
/**
 * Parser for:
 * [opcode] [arg1] [arg2] [argX]
 *
 * @export
 * @class ASTInstruction
 * @extends {KindASTNode('Instruction')}
 */
export class ASTInstruction extends KindASTNode(ASTNodeKind.INSTRUCTION) {
  public typedArgs: {[type in InstructionArgType]: (ASTInstructionArg|ASTInstructionMemArg)[]};
  public args: ASTInstructionArg[];
  public schema: ASTInstructionSchema;

  constructor(
    public readonly opcode: string,
    public readonly argsTokens: Token<any>[],
    public readonly prefixes: number = 0x0,
    loc: ASTNodeLocation,
  ) {
    super(loc);
  }

  isResolvedSchema(): boolean { return !!this.schema; }

  get numArgs() { return this.typedArgs[InstructionArgType.NUMBER]; }
  get memArgs() { return this.typedArgs[InstructionArgType.MEMORY]; }
  get regArgs() { return this.typedArgs[InstructionArgType.REGISTER]; }

  /**
   * @todo
   * Add prefixes
   *
   * @returns {string}
   * @memberof ASTInstruction
   */
  toString(): string {
    const {schema, args} = this;

    return toStringArgsList(schema.mnemonic, args);
  }

  /**
   * Search for ModRM byte parameter, it might be register or memory,
   * it is flagged using schema.rm boolean
   *
   * @returns {ASTInstructionArg}
   * @memberof ASTInstruction
   */
  findRMArg(): ASTInstructionArg {
    return R.find<ASTInstructionArg>(
      (arg) => arg.schema.rm,
      this.args,
    );
  }

  /**
   * Search if all labels are present
   *
   * @returns {ASTInstruction}
   * @memberof ASTInstruction
   */
  tryResolveSchema(): ASTInstruction {
    const {opcode, argsTokens} = this;

    // decode instructions
    // find matching opcode emitter by args
    const args = ASTInstruction.parseInstructionArgsTokens(argsTokens);
    const schema = findMatchingOpcode(COMPILER_INSTRUCTIONS_SET, opcode, args);

    // there can be une
    if (!schema) {
      const unresolvedLabel = R.any(
        ({type}) => type === InstructionArgType.LABEL,
        args,
      );

      console.log(args, unresolvedLabel); // eslint-disable-line
      return null;
    }

    this.typedArgs = <any> R.reduce(
      (acc, item) => {
        acc[<any> item.type].push(item);
        return acc;
      },
      {
        [InstructionArgType.MEMORY]: [],
        [InstructionArgType.NUMBER]: [],
        [InstructionArgType.REGISTER]: [],
        [InstructionArgType.LABEL]: [],
      },
      args,
    );

    // assign matching schema
    for (let i = 0; i < schema.argsSchema.length; ++i)
      args[i].schema = schema.argsSchema[i];

    this.args = args;
    this.schema = schema;
    return this;
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

          // it will be resovled later..
          return new ASTInstructionArg(InstructionArgType.LABEL, token.text);

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
          if (acc.length
              && result.type !== InstructionArgType.LABEL
              && acc[acc.length - 1].type !== InstructionArgType.LABEL
              && result.byteSize !== acc[acc.length - 1].byteSize)
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
    const argsTokens = fetchTokensArgsList(parser);
    const instruction = new ASTInstruction(
      opcode,
      argsTokens,
      prefixes,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );

    return instruction.tryResolveSchema();
  }
}
