import * as R from 'ramda';

import {COMPILER_INSTRUCTIONS_SET} from '../../../constants/instructionSetSchema';

import {InstructionPrefix, MAX_COMPILER_REG_LENGTH} from '../../../constants';
import {
  BRANCH_ADDRESSING_SIZE_MAPPING,
  InstructionArgType,
  BranchAddressingType,
  InstructionArgSize,
} from '../../../types';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';

import {ASTParser, ASTTokensIterator} from '../ASTParser';
import {ASTNodeKind, BinaryLabelsOffsets} from '../types';

import {ASTInstructionSchema} from './ASTInstructionSchema';
import {
  ASTInstructionNumberArg,
  ASTInstructionMemPtrArg,
  ASTInstructionMemSegmentedArg,
  ASTInstructionRegisterArg,
  ASTInstructionArg,
} from './args';

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
  BranchAddressingTypeToken,
} from '../../lexer/tokens';

import {findMatchingInstructionSchemas} from './args/ASTInstructionArgMatchers';
import {reduceTextToBitset} from '../../compiler/utils';

/**
 * Used to detect if instruction wants to consume some bytes,
 * if so - it will popably consume at least 2 imm bytes
 * (due to IP size)
 *
 * @export
 * @param {string} opcode
 * @returns {boolean}
 */
export function isJumpInstruction(opcode: string): boolean {
  return opcode[0] === 'j' || opcode === 'call';
}

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
  let separatorToken = null;

  do {
    // value or size operand
    let token = parser.fetchRelativeToken();
    if (token.type === TokenType.EOL || token.type === TokenType.EOF)
      break;

    argsTokens.push(token);

    // far / near jmp instruction args prefix
    if (token.kind === TokenKind.BRANCH_ADDRESSING_TYPE) {
      token = parser.fetchRelativeToken();
      argsTokens.push(token);
    }

    // if it was size operand - fetch next token which is prefixed
    if (allowSizeOverride && token.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
      argsTokens.push(
        parser.fetchRelativeToken(),
      );
    }

    // comma or other separator
    separatorToken = parser.fetchRelativeToken();

    // handle comma between numbers in some addressing modes
    if (separatorToken?.type === TokenType.COLON)
      argsTokens.push(separatorToken);
  } while (
    separatorToken && (
      separatorToken.type === TokenType.COMMA
        || separatorToken.type === TokenType.COLON
    )
  );

  return argsTokens;
}
/**
 * Parser for:
 * [opcode] [arg1] [arg2] [argX]
 *
 * @todo
 *  Maybe remove originalArgs and check if instruction
 *  has LABEL etc stuff in better way?
 *
 * @export
 * @class ASTInstruction
 * @extends {KindASTNode('Instruction')}
 */
export class ASTInstruction extends KindASTNode(ASTNodeKind.INSTRUCTION) {
  public typedArgs: {[type in InstructionArgType]: (ASTInstructionArg|ASTInstructionMemPtrArg)[]};
  public schemas: ASTInstructionSchema[];

  // jump/branch related args
  public branchAddressingType: BranchAddressingType = null;
  public jumpInstruction: boolean = false;

  // initial args is constant, it is
  // toggled on first pass, during AST tree analyze
  // args might change in second phase
  public originalArgs: ASTInstructionArg[];
  public args: ASTInstructionArg[];

  constructor(
    public readonly opcode: string,
    public argsTokens: Token<any>[],
    public readonly prefixes: InstructionPrefix[] = [],
    loc: ASTNodeLocation,
  ) {
    super(loc);

    // decode FAR/NEAR JMP addressing type prefixes
    if (argsTokens.length && argsTokens[0].kind === TokenKind.BRANCH_ADDRESSING_TYPE) {
      this.branchAddressingType = (<BranchAddressingTypeToken> argsTokens[0]).value;
      this.argsTokens = R.tail(argsTokens);
    } else
      this.argsTokens = argsTokens;

    // check if instruction is branch instruction
    this.jumpInstruction = isJumpInstruction(opcode);
  }

  get numArgs() { return this.typedArgs[InstructionArgType.NUMBER]; }
  get memArgs() { return this.typedArgs[InstructionArgType.MEMORY]; }
  get segMemArgs() { return this.typedArgs[InstructionArgType.SEGMENTED_MEMORY]; }
  get regArgs() { return this.typedArgs[InstructionArgType.REGISTER]; }
  get labelArgs() { return this.typedArgs[InstructionArgType.LABEL]; }
  get relAddrArgs() { return this.typedArgs[InstructionArgType.RELATIVE_ADDR]; }

  /**
   * Lookups in original args that are emitted after compiling AST
   *
   * @returns {boolean}
   * @memberof ASTInstruction
   */
  hasLabelsInOriginalAST(): boolean {
    return R.any(
      (arg: ASTInstructionArg) => arg.type === InstructionArgType.LABEL,
      this.originalArgs,
    );
  }

  /**
   * Groups args into types
   *
   * @todo
   *  Find better solution, it is not memory friendly
   *
   * @private
   * @memberof ASTInstruction
   */
  private refreshTypedArgs(): void {
    this.typedArgs = <any> R.reduce(
      (acc, item) => {
        acc[<any> item.type].push(item);
        return acc;
      },
      // todo: optimize
      {
        [InstructionArgType.MEMORY]: [],
        [InstructionArgType.SEGMENTED_MEMORY]: [],
        [InstructionArgType.NUMBER]: [],
        [InstructionArgType.REGISTER]: [],
        [InstructionArgType.LABEL]: [],
        [InstructionArgType.RELATIVE_ADDR]: [],
      },
      this.args,
    );
  }

  /**
   * @todo
   * Add prefixes
   *
   * @returns {string}
   * @memberof ASTInstruction
   */
  toString(): string {
    const {schemas, originalArgs, branchAddressingType} = this;
    if (schemas.length === 1) {
      let {mnemonic} = schemas[0];
      if (branchAddressingType)
        mnemonic = `${mnemonic} ${branchAddressingType}`;

      return toStringArgsList(mnemonic, originalArgs);
    }

    return `[?] ${toStringArgsList(this.opcode, this.argsTokens)}`;
  }

  /**
   * Search for ModRM byte parameter, it might be register or memory,
   * it is flagged using schema.rm boolean
   *
   * @returns {ASTInstructionArg}
   * @memberof ASTInstruction
   */
  findRMArg(): ASTInstructionMemPtrArg {
    return <ASTInstructionMemPtrArg> R.find<ASTInstructionArg>(
      (arg) => arg.schema?.rm,
      this.args,
    );
  }

  /**
   * Assigns aboslute label address to labels
   *
   * @param {BinaryLabelsOffsets} labels
   * @returns {ASTInstruction}
   * @memberof ASTInstruction
   */
  assignLabelsToArgs(labels: BinaryLabelsOffsets): ASTInstruction {
    this.args = R.map(
      (arg) => {
        if (arg.type !== InstructionArgType.LABEL)
          return arg;

        const label = <string> arg.value;
        const labelAddress = labels.get(label);

        if (R.isNil(labelAddress))
          throw new ParserError(ParserErrorCode.UNKNOWN_LABEL, null, {label});

        return new ASTInstructionNumberArg(labelAddress, null, null, InstructionArgType.RELATIVE_ADDR);
      },
      this.originalArgs,
    );

    this.refreshTypedArgs();
    return this;
  }

  /**
   * Search if all labels are present
   *
   * @returns {ASTInstruction}
   * @memberof ASTInstruction
   */
  tryResolveSchema(): ASTInstruction {
    const {branchAddressingType, argsTokens, jumpInstruction} = this;

    // generate first time args from tokenArgs, it is in first phrase
    // in second phrase args might be overriden
    if (!this.originalArgs) {
      const args = ASTInstruction.parseInstructionArgsTokens(
        branchAddressingType,
        argsTokens,
        jumpInstruction
          ? InstructionArgSize.WORD
          : null,
      );

      this.originalArgs = args;
      this.args = args;

      this.refreshTypedArgs();
    }

    // list all of schemas
    this.schemas = findMatchingInstructionSchemas(COMPILER_INSTRUCTIONS_SET, this);

    // assign matching schema
    const {schemas, args} = this;
    for (let i = 0; i < args.length; ++i)
      args[i].schema = schemas.length > 0 ? schemas[0].argsSchema[i] : null;

    // if not found any matching schema - resolving failed
    return schemas.length ? this : null;
  }

  /**
   * Transforms list of tokens into arguments
   *
   * @static
   * @param {BranchAddressingType} branchAddressingType
   * @param {Token[]} tokens
   * @param {number} [defaultMemArgByteSize=null]
   * @returns {ASTInstructionArg<any>[]}
   * @memberof ASTInstruction
   */
  static parseInstructionArgsTokens(
    branchAddressingType: BranchAddressingType,
    tokens: Token[],
    defaultMemArgByteSize: number = null,
  ): ASTInstructionArg<any>[] {
    let byteSizeOverride = null;
    const branchSizeOverride: number = (
      branchAddressingType
        ? BRANCH_ADDRESSING_SIZE_MAPPING[branchAddressingType] * 2
        : null
    );

    /**
     * Checks size of number, applies override and throw if error
     *
     * @param {Token} token
     * @param {number} number
     * @param {number} byteSize
     * @returns {ASTInstructionNumberArg}
     */
    function parseNumberArg(token: Token, number: number, byteSize: number): ASTInstructionNumberArg {
      // if no - number
      if (!R.isNil(byteSizeOverride) && byteSizeOverride < byteSize) {
        throw new ParserError(
          ParserErrorCode.EXCEEDING_CASTED_NUMBER_SIZE,
          null,
          {
            value: token.text,
            size: byteSize,
            maxSize: byteSizeOverride,
          },
        );
      }

      return new ASTInstructionNumberArg(number, byteSizeOverride ?? byteSize);
    }

    /**
     * Consumes token and product instruction arg
     *
     * @param {Token} token
     * @param {ASTTokensIterator} iterator
     * @returns {ASTInstructionArg<any>}
     */
    function parseToken(token: Token, iterator: ASTTokensIterator): ASTInstructionArg<any> {
      const nextToken = iterator.fetchRelativeToken(1, false);

      switch (token.type) {
        // Quotes are converted into digits
        case TokenType.QUOTE: {
          const {text} = token;

          if (text.length > MAX_COMPILER_REG_LENGTH) {
            throw new ParserError(
              ParserErrorCode.INCORRECT_ARG_QUOTE_TEXT_LENGTH,
              null,
              {
                maxSize: MAX_COMPILER_REG_LENGTH,
                text,
              },
            );
          }

          return parseNumberArg(token, reduceTextToBitset(text), text.length);
        }

        // Registers
        case TokenType.KEYWORD:
          if (token.kind === TokenKind.REGISTER) {
            const {schema, byteSize} = (<RegisterToken> token).value;

            return new ASTInstructionRegisterArg(schema, byteSize);
          }

          if (token.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
            let newByteSize = (<SizeOverrideToken> token).value.byteSize;

            // not sure if it is ok but in nasm byte size in branch mode
            // is as twice as big as override so multiply by 2
            if (branchSizeOverride) {
              if (newByteSize * 2 < branchSizeOverride)
                throw new ParserError(ParserErrorCode.OPERAND_SIZES_MISMATCH);
              else
                newByteSize *= 2;
            }

            byteSizeOverride = newByteSize;
            return null;
          }

          // used for mem matching, in first phase
          return new ASTInstructionArg(InstructionArgType.LABEL, token.text);

        // Numeric or address segmented address
        case TokenType.NUMBER: {
          const {number, byteSize} = (<NumberToken> token).value;

          // check if next token is colon, if so - it is segmented arg
          // do not pass it directly as SegmentedAddress into AST argument
          // it can contain label, just ignore type of precceding token
          // and throw error if not pass inside arg parser
          if (nextToken?.type === TokenType.COLON) {
            iterator.consume();

            return new ASTInstructionMemSegmentedArg(
              `${token.text}:${iterator.consume()?.text}`,
              byteSizeOverride ?? branchSizeOverride ?? byteSize,
            );
          }

          return parseNumberArg(token, number, byteSize);
        }

        // Mem address ptr
        case TokenType.BRACKET:
          if (token.kind === TokenKind.SQUARE_BRACKET) {
            const memSize = byteSizeOverride ?? branchSizeOverride ?? defaultMemArgByteSize;

            if (R.isNil(memSize))
              throw new ParserError(ParserErrorCode.MISSING_MEM_OPERAND_SIZE);

            return new ASTInstructionMemPtrArg(
              <string> token.text,
              memSize,
            );
          }
          break;

        default:
      }

      // force throw error if not known format
      throw new ParserError(
        ParserErrorCode.INVALID_INSTRUCTION_OPERAND,
        null,
        {
          operand: token.text,
        },
      );
    }

    // a bit faster than transduce
    const argsTokensIterator = new ASTTokensIterator(tokens);
    const acc: ASTInstructionArg[] = [];

    argsTokensIterator.iterate(
      (token: Token) => {
        const result = parseToken(token, argsTokensIterator);
        if (!result)
          return;

        const sizeMismatch = (
          acc.length
            && result.type !== InstructionArgType.LABEL
            && acc[acc.length - 1].type !== InstructionArgType.LABEL
            && result.byteSize !== acc[acc.length - 1].byteSize
        );

        if (sizeMismatch) {
          // handle something like this: mov ax, 2
          // second argument has byteSize equal to 1, but ax is 2
          // try to cast
          const prevByteSize = acc[acc.length - 1].byteSize;
          if (result.type === InstructionArgType.NUMBER && result.byteSize < prevByteSize)
            (<ASTInstructionNumberArg> result).upperCastByteSize(prevByteSize);

          // otherwise if it is mem arg, throw error
          else
            throw new ParserError(ParserErrorCode.OPERAND_SIZES_MISMATCH);
        }

        acc.push(result);
      },
    );

    return acc;
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
    const prefixes: InstructionPrefix[] = [];
    do {
      const prefix = InstructionPrefix[R.toUpper(<string> token.text)];
      if (!prefix)
        break;

      prefixes.push(prefix);
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
