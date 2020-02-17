import {X86BitsMode, X86RegName} from '../../emulator/types';

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
    public readonly mnemonic: X86RegName,
    public readonly index: number,
    public readonly byteSize: X86BitsMode,
    public readonly segment: boolean,
  ) {}
}
