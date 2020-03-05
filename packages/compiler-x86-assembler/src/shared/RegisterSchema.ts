import {X86BitsMode, ExtendedX86RegName} from '@emulator/x86-cpu/types';

export class RegisterSchema {
  /**
   * Creates an instance of Register.
   *
   * @param {X86RegName} mnemonic
   * @param {number} index
   * @param {X86BitsMode} byteSize
   * @param {boolean} segment
   * @memberof Register
   */
  constructor(
    public readonly mnemonic: ExtendedX86RegName,
    public readonly index: number,
    public readonly byteSize: X86BitsMode,
    public readonly segment: boolean,
  ) {}

  toString() {
    return this.mnemonic;
  }
}
