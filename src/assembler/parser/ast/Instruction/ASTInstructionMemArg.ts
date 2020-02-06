import * as R from 'ramda';

import {lexer} from '../../lexer/lexer';
import {isOperator} from '../../../utils/matchCharacter';

import {
  TokenType,
  TokenKind,
  Token,
  RegisterToken,
  NumberToken,
} from '../../lexer/tokens';

import {RegisterSchema} from '../../../types/RegisterSchema';
import {
  InstructionArgType,
  MemAddressDescription,
  isValidScale,
  MemSIBScale,
} from '../../../types/InstructionArg';

import {ASTInstructionArg} from './ASTInstructionArg';

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
 * Transforms [ax:bx+si*4] into descriptor object
 *
 * @param {string} expression
 * @returns {MemAddressDescription}
 */
function parseMemExpression(expression: string): MemAddressDescription {
  const tokens = Array.from(
    lexer(
      prefixMemPhraseWithSign('+', expression),
      false,
    ),
  );

  const addressDescription: MemAddressDescription = {
    disp: 0,
  };

  const resolveScale = (op1: Token, op2: Token, op3: Token): boolean => {
    if (!op1 || !op2 || !op3 || op2.type !== TokenType.MUL)
      return false;

    if (!op3)
      throw new Error('Missing mul second arg!');

    if (addressDescription.scale)
      throw new Error('Scale is already defined!');

    // pick args values
    let scale: number = null;
    let reg: RegisterSchema = null;

    if (op1.kind === TokenKind.REGISTER && op3.type === TokenType.NUMBER)
      [scale, reg] = [(<NumberToken> op3).value.number, (<RegisterToken> op1).value.schema];
    else if (op3.kind === TokenKind.REGISTER && op1.type === TokenType.NUMBER)
      [scale, reg] = [(<NumberToken> op1).value.number, (<RegisterToken> op3).value.schema];
    else
      throw new Error('Incorrect scale mem params!');

    if (!isValidScale(scale))
      throw new Error(`Incorrect scale! It must be 1, 2, 4 or 8 instead of ${scale}!`);

    // assign value
    addressDescription.scale = {
      value: <MemSIBScale> scale,
      reg,
    };

    return true;
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
            throw new Error(`Provided register ${op1.text} is not segment register!`);
        } else
          throw new Error('Syntax error!');
        break;

      // [..:+ah+si*4] etc
      case TokenType.MINUS:
        if (op2.type === TokenType.NUMBER) {
          addressDescription.disp -= (<NumberToken> op2).value.number;
          ++i;
        } else
          throw new Error('Incorrect operand must be number!');
        break;

      case TokenType.PLUS:
        if (resolveScale(op2, tokens[i + 2], tokens[i + 3]))
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
            throw new Error('Incorrect expression!');

          ++i;
        } else if (op2.type === TokenType.NUMBER) {
          addressDescription.disp += (<NumberToken> op2).value.number;
          ++i;
        } else
          throw new Error('Incorrect right operand!');
        break;

      default:
        throw new Error(`Unknown mem token ${op1.text}(${op1.type})!`);
    }
  }

  return addressDescription;
}

/**
 * Resolves instrction from text schema like this:
 * [ds:cx+4*si+disp]
 *
 * @class ASTInstructionMemArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionMemArg extends ASTInstructionArg {
  public phrase: string;
  public addressDescription: MemAddressDescription;

  constructor(phrase: string, byteSize: number) {
    super(InstructionArgType.MEMORY, null, byteSize, false);

    this.phrase = phrase;
    this.tryResolve();
  }

  /**
   * See format example:
   * @see {@link https://stackoverflow.com/a/34058400}
   *
   * @returns {boolean}
   * @memberof ASTInstructionMemArg
   */
  tryResolve(): boolean {
    const {phrase} = this;

    this.addressDescription = parseMemExpression(phrase);
    return super.tryResolve();
  }
}
