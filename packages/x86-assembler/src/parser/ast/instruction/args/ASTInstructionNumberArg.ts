import {
  roundToPowerOfTwo,
  numberByteSize,
  roundedSignedNumberByteSize,
} from '@ts-c-compiler/core';

import { InstructionArgType } from '../../../../types';
import { toUnsignedNumber } from '../../../../utils';

import { ASTInstructionArg } from './ASTInstructionArg';

/**
 * Instruction arg that contains number
 */
export class ASTInstructionNumberArg extends ASTInstructionArg<number> {
  public signedByteSize: number;
  public signedNumber: number;

  constructor(
    number: number,
    byteSize?: number,
    signedByteSize?: number,
    type: InstructionArgType = InstructionArgType.NUMBER,
    readonly assignedLabel: string = null,
  ) {
    super(type, number, byteSize ?? roundToPowerOfTwo(numberByteSize(number)));

    /**
     * size of number that is encoded as signed U2, it multiplies * 2 size of unsigned
     *
     * check this:
     * mov ax, -0xFFFF
     * byte size of second argument should be 2 because NASM ignores sign
     */
    this.signedByteSize = signedByteSize ?? roundedSignedNumberByteSize(number);
    this.signedNumber = toUnsignedNumber(number, this.signedByteSize as any);
  }

  /**
   * Used for upper cast for some instructions
   */
  upperCastByteSize(byteSize: number): void {
    this.byteSize = Math.max(this.byteSize, byteSize);

    this.signedByteSize = roundToPowerOfTwo(
      numberByteSize(0xff << (this.byteSize * 0x8 + 1)),
    );
    this.signedNumber = toUnsignedNumber(this.value, <any>byteSize);
  }

  /**
   * Check if unsigned number size is different than signed,
   * if so - signed number overflows byteSize and can be wrapped or expanded
   */
  get signOverflow() {
    return this.signedByteSize !== this.byteSize;
  }
}
