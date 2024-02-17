import { UnionStruct, bits } from '@ts-cc/core';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/colorreg.htm}
 *
 * Port 3C8h -- DAC Address Write Mode Register
 * Port 3C7h -- DAC Address Read Mode Register
 * Port 3C9h -- DAC Data Register
 * Port 3C7h -- DAC State Register
 */

/**
 * DAC Address Write Mode Register (Read/Write at 3C8h)
 */
export class DACDataReg extends UnionStruct {
  @bits(0, 5) data: number;
}

/**
 * DAC State Register (Read at 3C7h)
 */
export class DACStateReg extends UnionStruct {
  @bits(0, 1) state: number;
}

export enum VGADacState {
  WRITE = 0x0,
  READ = 0x3,
}

export enum VGADacEntry {
  REG = 0x0,
  GREEN = 0x1,
  BLUE = 0x2,
}

/**
 * Group of DAC regs
 */
export class VGADacRegs {
  writeAddressReg = 0x0; /* Port 3C8h */
  readAddressReg = 0x0; /* Port 3C7h */
  dataReg = new DACDataReg(); /* Port 3C9h */
  stateReg = new DACStateReg(); /* Port 3C7h */

  colorIndexWrite = 0;
  colorIndexRead = 0;
  pixelMask = 0xf;
}
