import {RegisterSchema} from '@compiler/x86-assembler/constants';
import {RMAddressingMode} from '@emulator/x86-cpu/types';
import {InstructionArgSize, MemAddressDescription} from '../../../types';

/**
 * Matches addressing mode
 *
 * @todo
 *  Reduce if, maybe there is a way to calculate RM byte instead using table?
 *
 * @see
 *  Table 2-1. 16-Bit Addressing Forms with the ModR/M Byte
 *
 *
 * @export
 * @param {InstructionArgSize} mode
 * @param {MemAddressDescription} addressDescription
 * @param {RegisterSchema} regSchema
 * @param {number} signedDispRoundedSize
 * @param {boolean} [swapped=false]
 * @returns {[number, number]}
 */
export function findMatchingMemAddressingRMByte(
  mode: InstructionArgSize,
  addressDescription: MemAddressDescription,
  regSchema: RegisterSchema,
  signedDispRoundedSize: number,
  swapped: boolean = false,
): [number, number] {
  const {
    reg: baseRegSchema,
    scale: scaleSchema,
  } = addressDescription;

  const baseReg = baseRegSchema?.mnemonic;
  const scaleReg = scaleSchema?.reg?.mnemonic;

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
    return findMatchingMemAddressingRMByte(mode, addressDescription, regSchema, signedDispRoundedSize, true);

  return null;
}
