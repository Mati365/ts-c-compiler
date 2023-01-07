import { RegisterSchema } from '@x86-toolkit/assembler/constants';
import { RMAddressingMode } from '@x86-toolkit/cpu/types';
import { InstructionArgSize, MemAddressDescription } from '../../../types';

/**
 * Matches addressing mode
 *
 * @todo
 *  Reduce if, maybe there is a way to calculate RM byte instead using table?
 *
 * @see
 *  Table 2-1. 16-Bit Addressing Forms with the ModR/M Byte
 */
export function findMatchingMemAddressingRMByte(
  mode: InstructionArgSize,
  addressDescription: MemAddressDescription,
  regSchema: RegisterSchema,
  signedDispRoundedSize: number,
  swappedRegs: boolean = false,
): [number, number] {
  const { reg: baseRegSchema, reg2: secondRegSchema } = addressDescription;

  let baseReg = baseRegSchema?.mnemonic;
  let secondReg = secondRegSchema?.mnemonic;
  let rm = null;

  if (swappedRegs) {
    const temp = secondReg;

    secondReg = baseReg;
    baseReg = temp;
  }

  if (mode === InstructionArgSize.WORD) {
    // MOD = 00
    if (signedDispRoundedSize === null) {
      if (baseReg === 'bx' && secondReg === 'si') {
        rm = 0b000;
      } else if (baseReg === 'bx' && secondReg === 'di') {
        rm = 0b001;
      } else if (baseReg === 'bp' && secondReg === 'si') {
        rm = 0b010;
      } else if (baseReg === 'bp' && secondReg === 'di') {
        rm = 0b011;
      } else if (!secondReg) {
        if (baseReg === 'si') {
          rm = 0b100;
        } else if (baseReg === 'di') {
          rm = 0b101;
        } else if (baseReg === 'bx') {
          rm = 0b111;
        }
      }

      if (rm !== null) {
        return [RMAddressingMode.INDIRECT_ADDRESSING, rm];
      }
    } else if (
      !baseReg &&
      !secondReg &&
      signedDispRoundedSize <= InstructionArgSize.WORD
    ) {
      return [RMAddressingMode.INDIRECT_ADDRESSING, 0b110];
    }

    // MOD = 01 / MOD = 10
    if (signedDispRoundedSize === 0x1 || signedDispRoundedSize === 0x2) {
      if (baseReg === 'bx' && secondReg === 'si') {
        rm = 0b000;
      } else if (baseReg === 'bx' && secondReg === 'di') {
        rm = 0b001;
      } else if (baseReg === 'bp' && secondReg === 'si') {
        rm = 0b010;
      } else if (baseReg === 'bp' && secondReg === 'di') {
        rm = 0b011;
      } else if (!secondReg) {
        if (baseReg === 'si') {
          rm = 0b100;
        } else if (baseReg === 'di') {
          rm = 0b101;
        } else if (baseReg === 'bp') {
          rm = 0b110;
        } else if (baseReg === 'bx') {
          rm = 0b111;
        }
      }

      if (rm !== null) {
        return [signedDispRoundedSize, rm];
      }
    }
  }

  // handle case mov byte [di+bx], 0xF
  // if swap, it will be correct
  if (!swappedRegs && secondReg && baseReg) {
    return findMatchingMemAddressingRMByte(
      mode,
      addressDescription,
      regSchema,
      signedDispRoundedSize,
      true,
    );
  }

  return null;
}
