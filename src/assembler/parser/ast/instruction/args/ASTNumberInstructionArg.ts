import {
  roundToPowerOfTwo,
  numberByteSize,
} from '../../../../utils/numberByteSize';

import {X86AbstractCPU} from '../../../../../emulator/types';
import {InstructionArgType} from '../../../../types';
import {ASTInstructionArg} from './ASTInstructionArg';

/**
 * Instruction arg that contains number
 *
 * @export
 * @class ASTNumberInstructionArg
 * @extends {ASTInstructionArg}
 */
export class ASTNumberInstructionArg extends ASTInstructionArg<number> {
  public signedByteSize: number;
  public signedNumber: number;

  constructor(
    number: number,
    byteSize?: number,
    signedByteSize?: number,
    type: InstructionArgType = InstructionArgType.NUMBER,
  ) {
    super(
      type,
      number,
      byteSize ?? roundToPowerOfTwo(numberByteSize(number)),
    );

    this.signedByteSize = signedByteSize ?? roundToPowerOfTwo(numberByteSize(number << 1));
    this.signedNumber = X86AbstractCPU.toUnsignedNumber(
      number,
      <any> this.signedByteSize,
    );
  }

  /**
   * Used for upper cast for some instructions
   *
   * @param {number} byteSize
   * @memberof ASTNumberInstructionArg
   */
  upperCastByteSize(byteSize: number): void {
    this.byteSize = Math.max(this.byteSize, byteSize);
    this.signedByteSize = roundToPowerOfTwo(numberByteSize(0xFF << (this.byteSize * 0x8 + 1)));
  }
}
