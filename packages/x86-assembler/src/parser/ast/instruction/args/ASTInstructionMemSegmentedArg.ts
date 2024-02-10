import * as E from 'fp-ts/Either';
import { Token, NumberToken, NumberTokenValue } from '@ts-c-compiler/lexer';

import { ParserError, ParserErrorCode } from '../../../../shared/ParserError';
import {
  ASTExpressionParserResult,
  ASTExpressionParserError,
} from '../../critical/ASTExpression';

import { InstructionArgSize, InstructionArgType } from '../../../../types';

import { ASTInstructionArg } from './ASTInstructionArg';
import { ASTLabelAddrResolver } from '../ASTResolvableArg';

import { asmLexer } from '../../../lexer/asmLexer';
import { isPossibleLabelToken, assignLabelsToTokens } from '../../../utils';

export class ASTSegmentedAddressDescription {
  constructor(
    readonly segment: NumberTokenValue,
    readonly offset: NumberTokenValue,
  ) {}
}

/**
 * Parses 0x7C00:0x123 into segment / offset
 */
export function parseSegmentedMemExpression(
  labelResolver: ASTLabelAddrResolver,
  expression: string,
): ASTExpressionParserResult<ASTSegmentedAddressDescription> {
  let tokens = Array.from(
    asmLexer({
      appendEOF: false,
    })(expression),
  );

  if (tokens?.length !== 3) {
    throw new ParserError(ParserErrorCode.INCORRECT_SEGMENTED_MEM_ARGS_COUNT, null, {
      count: tokens?.length || 0,
    });
  }

  // assign labels if labelResolver is present
  if (labelResolver) {
    tokens = assignLabelsToTokens(labelResolver, tokens);
  }

  // segment, colon, offset
  const [segment, , offset] = <[NumberToken, Token, NumberToken]>tokens;
  if (isPossibleLabelToken(segment) || isPossibleLabelToken(offset)) {
    if (labelResolver) {
      throw new ParserError(ParserErrorCode.INCORRECT_MEM_EXPRESSION, null, {
        expression,
      });
    } else {
      return E.left(ASTExpressionParserError.UNRESOLVED_LABEL);
    }
  }

  const { byteSize: segByteSize } = segment.value;
  const { byteSize: offsetByteSize } = offset.value;

  if (segByteSize > InstructionArgSize.WORD) {
    throw new ParserError(ParserErrorCode.INCORRECT_SEGMENT_MEM_ARG_SIZE, null, {
      size: segByteSize,
    });
  }

  if (offsetByteSize > InstructionArgSize.DWORD) {
    throw new ParserError(ParserErrorCode.INCORRECT_OFFSET_MEM_ARG_SIZE, null, {
      size: offsetByteSize,
    });
  }

  return E.right(new ASTSegmentedAddressDescription(segment.value, offset.value));
}

/**
 * Resolves instrction from text schema like this:
 * m16:32
 * m16:16
 *
 * @see
 *  byteSize define only OFFSET size!
 *  Segment size is constant, 2 bytes
 */
export class ASTInstructionMemSegmentedArg extends ASTInstructionArg<ASTSegmentedAddressDescription> {
  constructor(
    readonly phrase: string,
    byteSize: number,
  ) {
    super(InstructionArgType.SEGMENTED_MEMORY, null, byteSize, null, false);

    this.tryResolve();
  }

  /* eslint-disable class-methods-use-this */
  get offsetByteSize() {
    return this.byteSize;
  }
  get segmentByteSize() {
    return InstructionArgSize.WORD;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Used in diassembler
   */
  toString(): string {
    return this.phrase;
  }

  /**
   * Try to decode phrase
   */
  tryResolve(labelResolver?: ASTLabelAddrResolver): boolean {
    const { phrase, resolved } = this;
    if (resolved) {
      return resolved;
    }

    const parsedMemResult = parseSegmentedMemExpression(labelResolver, phrase);

    if (E.isRight(parsedMemResult)) {
      const parsedMem = parsedMemResult.right;
      const { byteSize: offsetByteSize } = parsedMem.offset;

      // prefixed size only includes offset
      // example: jmp byte 0xFFFF:0xFF
      // so byte is offset
      if (offsetByteSize > this.byteSize) {
        throw new ParserError(ParserErrorCode.OFFSET_MEM_ARG_SIZE_EXCEEDING_SIZE, null, {
          size: offsetByteSize,
          maxSize: this.byteSize,
        });
      }

      parsedMem.offset.byteSize = this.offsetByteSize;

      this.value = parsedMem;
      this.resolved = true;
    }

    return this.resolved;
  }
}
