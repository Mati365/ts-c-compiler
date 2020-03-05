import {ExtendedX86RegName, RMAddressingMode} from '@emulator/x86-cpu/types';
import {InstructionArgSize} from '../../../types';

/**
 * Matches addressing mode
 *
 * @todo
 *  Reduce if, maybe there is a way to calculate RM byte instead using table?
 *
 * @see
 *  Table 2-1. 16-Bit Addressing Forms with the ModR/M Byte
 *
 * @param {InstructionArgSize} mode
 * @param {ExtendedX86RegName} baseReg
 * @param {ExtendedX86RegName} scaleReg
 * @param {number} signedDispRoundedSize
 * @returns {[number, number]}
 */
export function findMatchingMemAddressingRMByte(
  mode: InstructionArgSize,
  baseReg: ExtendedX86RegName,
  scaleReg: ExtendedX86RegName,
  signedDispRoundedSize: number,
  swapped: boolean = false,
): [number, number] {
  let rm = null;

  if (mode === InstructionArgSize.WORD) {
    // MOD = 00
    if (signedDispRoundedSize === null) {
      if (baseReg === 'bx' && scaleReg === 'si') rm = 0b000;
      else if (baseReg === 'bx' && scaleReg === 'di') rm = 0b001;
      else if (baseReg === 'bp' && scaleReg === 'si') rm = 0b010;
      else if (baseReg === 'bp' && scaleReg === 'di') rm = 0b011;
      else if (!scaleReg) {
        if (baseReg === 'si') rm = 0b100;
        else if (baseReg === 'di') rm = 0b101;
        else if (baseReg === 'bx') rm = 0b111;
      }

      if (rm !== null)
        return [RMAddressingMode.INDIRECT_ADDRESSING, rm];
    } else if (!baseReg && !scaleReg && signedDispRoundedSize <= InstructionArgSize.WORD)
      return [RMAddressingMode.INDIRECT_ADDRESSING, 0b110];

    // MOD = 01 / MOD = 10
    if (signedDispRoundedSize === 0x1 || signedDispRoundedSize === 0x2) {
      if (baseReg === 'bx' && scaleReg === 'si') rm = 0b000;
      else if (baseReg === 'bx' && scaleReg === 'di') rm = 0b001;
      else if (baseReg === 'bp' && scaleReg === 'si') rm = 0b010;
      else if (baseReg === 'bp' && scaleReg === 'di') rm = 0b011;
      else if (!scaleReg) {
        if (baseReg === 'si') rm = 0b100;
        else if (baseReg === 'di') rm = 0b101;
        else if (baseReg === 'bp') rm = 0b110;
        else if (baseReg === 'bx') rm = 0b111;
      }

      if (rm !== null)
        return [signedDispRoundedSize, rm];
    }
  }

  // it might be mov ax, [si + bx] or mov [ax, bx + si]
  if (!swapped)
    return findMatchingMemAddressingRMByte(mode, scaleReg, baseReg, signedDispRoundedSize, true);

  return null;
}
