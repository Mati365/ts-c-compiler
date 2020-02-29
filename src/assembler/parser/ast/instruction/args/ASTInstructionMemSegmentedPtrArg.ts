import {InstructionArgType} from '../../../../types';
import {ASTInstructionArg} from './ASTInstructionArg';
import {SegmentedAddress} from '../../../../../emulator/types';

/**
 * Resolves instrction from text schema like this:
 * ptr16:32
 * ptr16:16
 *
 * @class ASTInstructionMemSegmentedPtrArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionMemSegmentedPtrArg extends ASTInstructionArg<SegmentedAddress> {
  constructor(
    public readonly phrase: string,
    byteSize: number,
  ) {
    super(InstructionArgType.SEGMENTED_MEMORY, null, byteSize, null, false);

    this.phrase = phrase;
    this.tryResolve();
  }

  /**
   * Used in diassembler
   *
   * @returns {string}
   * @memberof ASTInstructionMemPtrArg
   */
  toString(): string {
    const {value} = this;

    return `${value.segment}:${value.offset}`;
  }

  /**
   * See format example:
   * @see {@link https://stackoverflow.com/a/34058400}
   *
   * @returns {boolean}
   * @memberof ASTInstructionMemPtrArg
   */
  tryResolve(): boolean {
    console.log(this.phrase); // eslint-disable-line

    return super.tryResolve();
  }
}
