import {lexer} from '../../../lexer/lexer';

import {ParserError, ParserErrorCode} from '../../../../shared/ParserError';
import {
  ASTExpressionParserResult,
  ASTExpressionParserError,
  ok,
  err,
} from '../../ASTExpression';

import {
  InstructionArgSize,
  InstructionArgType,
} from '../../../../types';

import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTLabelAddrResolver} from '../ASTResolvableArg';
import {
  NumberToken,
  Token,
  NumberTokenValue,
} from '../../../lexer/tokens';

import {isPossibleLabelToken, assignLabelsToTokens} from '../../../utils';

export class ASTSegmentedAddressDescription {
  constructor(
    public readonly segment: NumberTokenValue,
    public readonly offset: NumberTokenValue,
  ) {}
}

/**
 * Parses 0x7C00:0x123 into segment / offset
 *
 * @export
 * @param {ASTLabelAddrResolverr} labelResolver
 * @param {string} expression
 * @returns {ASTExpressionParserResult<ASTSegmentedAddressDescription>}
 */
export function parseSegmentedMemExpression(
  labelResolver: ASTLabelAddrResolver,
  expression: string,
): ASTExpressionParserResult<ASTSegmentedAddressDescription> {
  let tokens = Array.from(
    lexer(expression, false),
  );

  if (tokens?.length !== 3) {
    throw new ParserError(
      ParserErrorCode.INCORRECT_SEGMENTED_MEM_ARGS_COUNT,
      null,
      {
        count: tokens?.length || 0,
      },
    );
  }

  // assign labels if labelResolver is present
  if (labelResolver)
    tokens = assignLabelsToTokens(labelResolver, tokens);

  // segment, colon, offset
  const [segment,, offset] = <[NumberToken, Token, NumberToken]> tokens;
  if (isPossibleLabelToken(segment) || isPossibleLabelToken(offset)) {
    if (labelResolver) {
      throw new ParserError(
        ParserErrorCode.UNKNOWN_MEM_TOKEN,
        null,
        {
          token: expression,
        },
      );
    } else
      return err(ASTExpressionParserError.UNRESOLVED_LABEL);
  }

  const {byteSize: segByteSize} = segment.value;
  const {byteSize: offsetByteSize} = offset.value;

  if (segByteSize > InstructionArgSize.WORD) {
    throw new ParserError(
      ParserErrorCode.INCORRECT_SEGMENT_MEM_ARG_SIZE,
      null,
      {
        size: segByteSize,
      },
    );
  }

  if (offsetByteSize > InstructionArgSize.DWORD) {
    throw new ParserError(
      ParserErrorCode.INCORRECT_OFFSET_MEM_ARG_SIZE,
      null,
      {
        size: offsetByteSize,
      },
    );
  }

  return ok(
    new ASTSegmentedAddressDescription(segment.value, offset.value),
  );
}

/**
 * Resolves instrction from text schema like this:
 * m16:32
 * m16:16
 *
 * @see
 *  byteSize define only OFFSET size!
 *  Segment size is constant, 2 bytes
 *
 * @class ASTInstructionMemSegmentedArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionMemSegmentedArg extends ASTInstructionArg<ASTSegmentedAddressDescription> {
  constructor(
    public readonly phrase: string,
    byteSize: number,
  ) {
    super(InstructionArgType.SEGMENTED_MEMORY, null, byteSize, null, false);

    this.tryResolve();
  }

  /* eslint-disable class-methods-use-this */
  get offsetByteSize() { return this.byteSize; }
  get segmentByteSize() { return InstructionArgSize.WORD; }
  /* eslint-enable class-methods-use-this */

  /**
   * Used in diassembler
   *
   * @returns {string}
   * @memberof ASTInstructionMemSegmentedArg
   */
  toString(): string {
    return this.phrase;
  }

  /**
   * Try to decode phrase
   *
   * @param {ASTLabelAddrResolver} [labelResolver]
   * @returns {boolean}
   * @memberof ASTInstructionMemSegmentedArg
   */
  tryResolve(labelResolver?: ASTLabelAddrResolver): boolean {
    const {phrase, resolved} = this;
    if (resolved)
      return resolved;

    const parsedMemResult = parseSegmentedMemExpression(labelResolver, phrase);

    if (parsedMemResult.isOk()) {
      const parsedMem = parsedMemResult.unwrap();
      const {byteSize: offsetByteSize} = parsedMem.offset;

      // prefixed size only includes offset
      // example: jmp byte 0xFFFF:0xFF
      // so byte is offset
      if (offsetByteSize > this.byteSize) {
        throw new ParserError(
          ParserErrorCode.OFFSET_MEM_ARG_SIZE_EXCEEDING_SIZE,
          null,
          {
            size: offsetByteSize,
            maxSize: this.byteSize,
          },
        );
      }

      parsedMem.offset.byteSize = this.offsetByteSize;

      this.value = parsedMem;
      this.resolved = true;
    }

    return this.resolved;
  }
}
