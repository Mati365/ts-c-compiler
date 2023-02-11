import * as R from 'ramda';

import { RegisterToken } from '@x86-toolkit/assembler/parser/lexer/tokens';
import { TokenType, TokenKind, Token } from '@compiler/lexer/tokens';

import {
  numberByteSize,
  roundToPowerOfTwo,
  signedNumberByteSize,
} from '@compiler/core/utils/numberByteSize';

import { assignLabelsToTokens } from '../../../utils';
import { asmLexer } from '../../../lexer/asmLexer';
import { safeKeywordResultRPN } from '../../../compiler/utils';

import { ASTLabelAddrResolver } from '../ASTResolvableArg';
import {
  ASTExpressionParserResult,
  ok,
  err,
} from '../../critical/ASTExpression';

import { ParserError, ParserErrorCode } from '../../../../shared/ParserError';
import {
  InstructionArgType,
  MemAddressDescription,
  isValidScale,
  MemSIBScale,
  InstructionArgSize,
} from '../../../../types';

import { ASTInstructionArg } from './ASTInstructionArg';

/**
 * Returns true if rest of tokens from RM should be calculated
 */
function shouldCalcRestMathTokens(tokens: Token[]): boolean {
  return (
    tokens.length &&
    R.any(
      token =>
        token.type === TokenType.NUMBER ||
        token.type === TokenType.KEYWORD ||
        token.type === TokenType.BRACKET,
      tokens,
    )
  );
}

/**
 * Transforms [ax:bx+si*4] into descriptor object
 */
function parseMemExpression(
  labelResolver: ASTLabelAddrResolver,
  expression: string,
): ASTExpressionParserResult<MemAddressDescription> {
  let tokens = Array.from(
    asmLexer(
      {
        appendEOF: false,
        signOperatorsAsSeparateTokens: true,
      },
      expression,
    ),
  );

  const addressDescription: MemAddressDescription = {
    disp: null,
    dispByteSize: null,
    signedByteSize: null,
  };

  // assign labels if labelResolver is present
  if (labelResolver) {
    tokens = assignLabelsToTokens(labelResolver, tokens);
  }

  // eat all register tokens
  for (let i = 0; i < tokens.length; ) {
    const [arg1, operator, arg2] = [tokens[i], tokens[i + 1], tokens[i + 2]];
    const currentReg =
      arg1.kind === TokenKind.REGISTER && (<RegisterToken>arg1).value.schema;

    // sreg:...
    if (!i && currentReg && operator?.type === TokenType.COLON) {
      addressDescription.sreg = currentReg;

      if (!addressDescription?.sreg) {
        throw new ParserError(
          ParserErrorCode.REGISTER_IS_NOT_SEGMENT_REG,
          null,
          { reg: arg1.text },
        );
      }

      tokens.splice(i, 2);

      // scale, reg*num or num*reg
    } else if (
      operator?.type === TokenType.MUL &&
      (currentReg || arg2?.kind === TokenKind.REGISTER)
    ) {
      if (addressDescription.scale) {
        throw new ParserError(ParserErrorCode.SCALE_IS_ALREADY_DEFINED);
      }

      // handle errors
      const [reg, expr] = currentReg ? [arg1, arg2] : [arg2, arg1];
      const scaleResult = safeKeywordResultRPN(
        {
          keywordResolver: labelResolver,
        },
        [expr],
      );
      if (scaleResult.isErr()) {
        return err(scaleResult.unwrapErr());
      }

      // calc scale
      const scale = scaleResult.unwrap();
      if (!isValidScale(scale)) {
        throw new ParserError(ParserErrorCode.INCORRECT_SCALE, null, { scale });
      }

      addressDescription.scale = {
        reg: (<RegisterToken>reg).value.schema,
        value: <MemSIBScale>scale,
      };

      tokens.splice(i, 3);
    } else if (currentReg) {
      // standalone offset register
      if (!addressDescription.reg) {
        addressDescription.reg = currentReg;
        tokens.splice(i, 1);

        // standalone second register
      } else if (!addressDescription.scale) {
        if (addressDescription.reg2) {
          throw new ParserError(ParserErrorCode.IMPOSSIBLE_MEM_REG);
        }

        addressDescription.reg2 = currentReg;
        tokens.splice(i, 1);
      } else {
        throw new ParserError(ParserErrorCode.INCORRECT_MEM_EXPRESSION, null, {
          expression,
        });
      }
    } else {
      ++i;
    }
  }

  // calc displacement if there is any remain number or label
  if (shouldCalcRestMathTokens(tokens)) {
    const dispResult = safeKeywordResultRPN(
      {
        keywordResolver: labelResolver,
      },
      tokens,
    );

    if (dispResult.isErr()) {
      return err(dispResult.unwrapErr());
    }

    addressDescription.disp = dispResult.unwrap();
  }

  if (addressDescription.disp !== null) {
    addressDescription.dispByteSize = numberByteSize(
      Math.abs(addressDescription.disp),
    );
    addressDescription.signedByteSize = signedNumberByteSize(
      addressDescription.disp,
    );
  } else if (
    !addressDescription.reg2 &&
    addressDescription.reg?.mnemonic === 'bp'
  ) {
    // special case for BP instruction specified in addressing mode table
    addressDescription.disp = 0;
    addressDescription.dispByteSize = 1;
    addressDescription.signedByteSize = 1;
  } else {
    addressDescription.dispByteSize = 0;
    addressDescription.signedByteSize = 0;
  }

  return ok(addressDescription);
}

/**
 * Resolves instrction from text schema like this:
 * [ds:cx+4*si+disp]
 */
export class ASTInstructionMemPtrArg extends ASTInstructionArg<MemAddressDescription> {
  constructor(readonly phrase: string, byteSize: number) {
    super(InstructionArgType.MEMORY, null, byteSize, null, false);

    this.phrase = phrase;
    this.tryResolve();
  }

  get addressDescription(): MemAddressDescription {
    return this.value as MemAddressDescription;
  }

  isDisplacementOnly(): boolean {
    const { value } = this;

    return !!(
      value &&
      R.isNil(value.reg) &&
      R.isNil(value.scale) &&
      R.is(Number, value.disp)
    );
  }

  isScaled() {
    const { value } = this;

    return !R.isNil(value.scale);
  }

  /**
   * Used in diassembler
   */
  toString(): string {
    const { byteSize, schema, phrase, value } = this;
    const parsedPhrase = phrase.replace(/\s/g, '');
    const sizePrefix: string =
      InstructionArgSize[byteSize] ??
      InstructionArgSize[roundToPowerOfTwo(byteSize)];

    if (!schema) {
      return `[${parsedPhrase}]`;
    }

    if (schema.moffset) {
      if (!value?.sreg) {
        return `ds:${parsedPhrase}`;
      }

      return parsedPhrase;
    }

    return `${sizePrefix} [${parsedPhrase}]`;
  }

  /**
   * See format example:
   * @see {@link https://stackoverflow.com/a/34058400}
   */
  tryResolve(labelResolver?: ASTLabelAddrResolver): boolean {
    const { phrase, resolved } = this;
    if (resolved) {
      return resolved;
    }

    const parsedMemResult = parseMemExpression(labelResolver, phrase);
    if (parsedMemResult.isOk()) {
      const parsedMem = parsedMemResult.unwrap();

      this.value = parsedMem;
      this.resolved = true;
    }

    return this.resolved;
  }
}
