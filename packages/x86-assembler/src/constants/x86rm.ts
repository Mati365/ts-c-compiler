export enum RMAddressingMode {
  INDIRECT_ADDRESSING = 0b00,
  ONE_BYTE_SIGNED_DISP = 0b01,
  FOUR_BYTE_SIGNED_DISP = 0b10,
  REG_ADDRESSING = 0b11,
}

/**
 * Addressing mode byte
 */
export class RMByte {
  constructor(
    public mod: number,
    public reg: number,
    public rm: number,
  ) {}

  getDisplacementByteSize(): number {
    switch (this.mod) {
      case RMAddressingMode.FOUR_BYTE_SIGNED_DISP:
        return 0x4;

      case RMAddressingMode.ONE_BYTE_SIGNED_DISP:
        return 0x1;

      default:
        return null;
    }
  }

  get byte() {
    const { rm, mod, reg } = this;

    return (rm & 0b111) | ((reg & 0b111) << 0x3) | ((mod & 0b11) << 0x6);
  }

  /**
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm}
   */
  static ofByte(byte: number) {
    return new RMByte(
      byte >> 0x6, // byte
      (byte >> 0x3) & 0x7, // reg
      byte & 0x7, // rm
    );
  }
}
