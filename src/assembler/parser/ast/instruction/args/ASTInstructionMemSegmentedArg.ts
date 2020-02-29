import {lexer} from '../../../lexer/lexer';
import {ParserError, ParserErrorCode} from '../../../../shared/ParserError';

import {
  InstructionArgSize,
  InstructionArgType,
} from '../../../../types';

import {ASTInstructionArg} from './ASTInstructionArg';
import {NumberToken, Token, NumberTokenValue} from '../../../lexer/tokens';

export class ASTSegmentedAddressDescription {
  constructor(
    public readonly segment: NumberTokenValue,
    public readonly offset: NumberTokenValue,
  ) {}
}

/**
 * Transforms [ax:bx+si*4] into descriptor object
 *
 * @export
 * @param {string} expression
 * @returns {ASTSegmentedAddressDescription}
 */
export function parseSegmentedMemExpression(expression: string): ASTSegmentedAddressDescription {
  const tokens = Array.from(
    lexer(expression, false),
  );

  if (tokens?.length !== 3)
    throw new ParserError(ParserErrorCode.INCORRECT_SEGMENTED_MEM_ARGS_COUNT, null, {count: tokens?.length || 0});

  // segment, colon, offset
  const [segment,, offset] = <[NumberToken, Token, NumberToken]> tokens;
  const {byteSize: segByteSize} = segment.value;
  const {byteSize: offsetByteSize} = offset.value;

  if (segByteSize > InstructionArgSize.WORD)
    throw new ParserError(ParserErrorCode.INCORRECT_SEGMENT_MEM_ARG_SIZE, null, {size: segByteSize});

  if (offsetByteSize > InstructionArgSize.DWORD)
    throw new ParserError(ParserErrorCode.INCORRECT_OFFSET_MEM_ARG_SIZE, null, {size: offsetByteSize});

  return new ASTSegmentedAddressDescription(segment.value, offset.value);
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
   * @returns {boolean}
   * @memberof ASTInstructionMemSegmentedArg
   */
  tryResolve(): boolean {
    const {phrase, resolved} = this;
    if (!resolved) {
      const parsedMem = parseSegmentedMemExpression(phrase);

      if (parsedMem) {
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
      }

      this.value = parsedMem;
    }

    return super.tryResolve();
  }
}
