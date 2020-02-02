import {X86BitsMode, X86RegName} from '../../emulator/types';

export class RegisterSchema {
  public mnemonic: X86RegName;
  public index: number;
  public byteSize: X86BitsMode;
  public segment: boolean;

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
    mnemonic: X86RegName,
    index: number,
    byteSize: X86BitsMode,
    segment: boolean,
  ) {
    this.mnemonic = mnemonic;
    this.index = index;
    this.byteSize = byteSize;
    this.segment = segment;
  }
}
