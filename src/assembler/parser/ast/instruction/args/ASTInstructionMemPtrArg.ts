import * as R from 'ramda';

import {lexer} from '../../../lexer/lexer';
import {assignLabelsToTokens} from '../../../utils';
import {isOperator} from '../../../../utils/matchCharacter';

import {ASTLabelAddrResolver} from '../ASTResolvableArg';
import {
  ASTExpressionParserResult,
  ASTExpressionParserError,
  ok,
  err,
} from '../../critical/ASTExpression';

import {ParserError, ParserErrorCode} from '../../../../shared/ParserError';
import {
  TokenType,
  TokenKind,
  Token,
  RegisterToken,
  NumberToken,
} from '../../../lexer/tokens';

import {RegisterSchema} from '../../../../shared/RegisterSchema';
import {
  InstructionArgType,
  MemAddressDescription,
  isValidScale,
  MemSIBScale,
  InstructionArgSize,
} from '../../../../types';

import {ASTInstructionArg} from './ASTInstructionArg';

import {reduceTextToBitset} from '../../../compiler/utils';
import {
  numberByteSize,
  roundToPowerOfTwo,
  signedNumberByteSize,
} from '../../../../utils/numberByteSize';

/**
 * Transforms:
 * [ax+bx*4] => [+ax+bx*4]
 * [ds:ax+bx*4] => [ds:+ax+bx*4]
 * [ds:-4] => [ds:-4]
 *
 * @param {string} sign
 * @param {string} phrase
 * @returns {string}
 */
function prefixMemPhraseWithSign(sign: string, phrase: string): string {
  const colonIndex = R.indexOf(':', <any> phrase);
  const prefixAtOffset = colonIndex !== -1 ? colonIndex + 1 : 0;

  if (isOperator(phrase[prefixAtOffset]))
    return phrase;

  const [left, right] = R.splitAt(prefixAtOffset, phrase);
  return `${left}${sign}${right}`;
}

/**
 * Decode si*4
 *
 * @param {Token} op1
 * @param {Token} op2
 * @param {Token} op3
 * @param {MemAddressDescription} addressDescription
 * @returns {boolean}
 */
function resolveScale(
  op1: Token,
  op2: Token,
  op3: Token,
  addressDescription: MemAddressDescription,
): boolean {
  if (!op1 || !op2 || !op3 || op2.type !== TokenType.MUL)
    return false;

  if (!op3)
    throw new ParserError(ParserErrorCode.MISSING_MUL_SECOND_ARG);

  if (addressDescription.scale)
    throw new ParserError(ParserErrorCode.SCALE_IS_ALREADY_DEFINED);

  // pick args values
  let scale: number = null;
  let reg: RegisterSchema = null;

  if (op1.kind === TokenKind.REGISTER && op3.type === TokenType.NUMBER)
    [scale, reg] = [(<NumberToken> op3).value.number, (<RegisterToken> op1).value.schema];
  else if (op3.kind === TokenKind.REGISTER && op1.type === TokenType.NUMBER)
    [scale, reg] = [(<NumberToken> op1).value.number, (<RegisterToken> op3).value.schema];
  else
    throw new ParserError(ParserErrorCode.INCORRECT_SCALE_MEM_PARAMS);

  if (!isValidScale(scale))
    throw new ParserError(ParserErrorCode.INCORRECT_SCALE, null, {scale});

  // assign value
  addressDescription.scale = {
    value: <MemSIBScale> scale,
    reg,
  };

  return true;
}

/**
 * Raise error in parser in first phase - when label resolved is not defined
 *
 * @param {boolean} exception
 * @param {ParserErrorCode} code
 * @param {object} [data]
 * @returns
 */
function raiseMemParserError(exception: boolean, code: ParserErrorCode, data?: object) {
  if (exception)
    throw new ParserError(code, null, data);
  else
    return err(ASTExpressionParserError.UNRESOLVED_LABEL);
}

/**
 * Transforms [ax:bx+si*4] into descriptor object
 *
 * @param {string} expression
 * @returns {ASTExpressionParserResult<MemAddressDescription>}
 */
function parseMemExpression(
  labelResolver: ASTLabelAddrResolver,
  expression: string,
): ASTExpressionParserResult<MemAddressDescription> {
  let tokens = Array.from(
    lexer(
      prefixMemPhraseWithSign('+', expression),
      false,
      true,
    ),
  );

  // assign labels if labelResolver is present
  if (labelResolver)
    tokens = assignLabelsToTokens(labelResolver, tokens);

  const addressDescription: MemAddressDescription = {
    disp: null,
    dispByteSize: null,
  };

  for (let i = 0; i < tokens.length; ++i) {
    const [op1, op2] = [tokens[i], tokens[i + 1]];

    switch (op1.type) {
      // segment prefix [ds:...]
      case TokenType.KEYWORD:
        if (op2?.type === TokenType.COLON) {
          const regOp1 = <RegisterToken> op1;

          addressDescription.sreg = regOp1.value?.schema;
          ++i;

          if (!addressDescription?.sreg)
            throw new ParserError(ParserErrorCode.REGISTER_IS_NOT_SEGMENT_REG, null, {reg: op1.text});
        } else {
          return raiseMemParserError(
            !!labelResolver,
            ParserErrorCode.SYNTAX_ERROR,
          );
        }
        break;

      // [..:+ah+si*4] etc
      case TokenType.MINUS:
        if (op2.type === TokenType.NUMBER) {
          addressDescription.disp -= (<NumberToken> op2).value.number;
          ++i;
        } else if (op2.type === TokenType.QUOTE) {
          addressDescription.disp -= reduceTextToBitset(op2.text);
          ++i;
        } else {
          return raiseMemParserError(
            !!labelResolver,
            ParserErrorCode.OPERAND_MUST_BE_NUMBER,
          );
        }
        break;

      case TokenType.PLUS:
        if (resolveScale(op2, tokens[i + 2], tokens[i + 3], addressDescription))
          i += 3;
        else if (op2.kind === TokenKind.REGISTER) {
          const reg = (<RegisterToken> op2).value.schema;

          if (!addressDescription.reg)
            addressDescription.reg = reg;
          else if (!addressDescription.scale) {
            addressDescription.scale = {
              value: 1,
              reg,
            };
          } else
            throw new ParserError(ParserErrorCode.INCORRECT_EXPRESSION);

          ++i;
        } else if (op2.type === TokenType.NUMBER) {
          addressDescription.disp += (<NumberToken> op2).value.number;
          ++i;
        } else if (op2.type === TokenType.QUOTE) {
          addressDescription.disp += reduceTextToBitset(op2.text);
          ++i;
        } else {
          return raiseMemParserError(
            !!labelResolver,
            ParserErrorCode.INCORRECT_OPERAND,
          );
        }
        break;

      default:
        raiseMemParserError(
          !!labelResolver,
          ParserErrorCode.UNKNOWN_MEM_TOKEN,
          {
            token: op1.text,
          },
        );
    }
  }

  if (addressDescription.disp !== null) {
    addressDescription.dispByteSize = numberByteSize(addressDescription.disp);
    addressDescription.signedByteSize = signedNumberByteSize(addressDescription.disp);
  }

  return ok(addressDescription);
}

/**
 * Resolves instrction from text schema like this:
 * [ds:cx+4*si+disp]
 *
 * @class ASTInstructionMemPtrArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionMemPtrArg extends ASTInstructionArg<MemAddressDescription> {
  constructor(
    public readonly phrase: string,
    byteSize: number,
  ) {
    super(InstructionArgType.MEMORY, null, byteSize, null, false);

    this.phrase = phrase;
    this.tryResolve();
  }

  get addressDescription(): MemAddressDescription {
    return <MemAddressDescription> this.value;
  }

  isDisplacementOnly(): boolean {
    const {value} = this;

    return !!(value && R.isNil(value.reg) && R.isNil(value.scale) && R.is(Number, value.disp));
  }

  isScaled() {
    const {value} = this;

    return !R.isNil(value.scale);
  }

  /**
   * Used in diassembler
   *
   * @returns {string}
   * @memberof ASTInstructionMemPtrArg
   */
  toString(): string {
    const {phrase, byteSize, schema} = this;
    const sizePrefix = InstructionArgSize[roundToPowerOfTwo(byteSize)];

    if (schema?.moffset)
      return phrase;

    return `${sizePrefix} ptr [${phrase}]`;
  }

  /**
   * See format example:
   * @see {@link https://stackoverflow.com/a/34058400}
   *
   * @param {ASTLabelAddrResolver} [labelResolver]
   * @returns {boolean}
   * @memberof ASTInstructionMemPtrArg
   */
  tryResolve(labelResolver?: ASTLabelAddrResolver): boolean {
    const {phrase, resolved, byteSize} = this;
    if (resolved)
      return resolved;

    const parsedMemResult = parseMemExpression(labelResolver, phrase);
    if (parsedMemResult.isOk()) {
      const parsedMem = parsedMemResult.unwrap();

      if (R.isNil(byteSize)) {
        if (R.isNil(parsedMem.dispByteSize))
          throw new ParserError(ParserErrorCode.MISSING_MEM_OPERAND_SIZE);

        this.byteSize = parsedMem.dispByteSize;
      }

      this.value = parsedMem;
      this.resolved = true;
    }

    return this.resolved;
  }
}
