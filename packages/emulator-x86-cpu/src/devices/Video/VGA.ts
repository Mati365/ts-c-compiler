import {uuidX86Device, X86BitsMode} from '../../types';

import {VirtualMemBlockDriver} from '../../memory/VirtualMemBlockDriver';
import {ByteMemRegionAccessor} from '../../memory/MemoryRegion';
import {X86CPU} from '../../X86CPU';

import {VGAExternalRegs} from './VGAExternalRegs';
import {VGAGraphicsRegs} from './VGAGraphicsRegs';

type VGA256State = {
  palette: Int32Array,
};

/**
 * Basic graphics device
 *
 * @export
 * @abstract
 * @class VGA
 * @extends {uuidX86Device<X86CPU>('vga')}
 */
export class VGA extends uuidX86Device<X86CPU>('vga') implements ByteMemRegionAccessor {
  private vga256: VGA256State;
  private vram: VirtualMemBlockDriver;

  /* regs */
  private externalRegs: VGAExternalRegs;
  private graphicsRegs: VGAGraphicsRegs;

  /**
   * Allocates memory
   *
   * @memberof VideoAdapter
   */
  init() {
    this.externalRegs = new VGAExternalRegs;
    this.graphicsRegs = new VGAGraphicsRegs;

    this.vram = VirtualMemBlockDriver.alloc(0x40000); // 256 KB
    this.vga256 = {
      palette: new Int32Array(256),
    };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * @todo Add write to VRAM
   *
   * @param {number} address
   * @param {number} value
   * @param {X86BitsMode} bits
   * @returns {number}
   * @memberof VGA
   */
  writeUInt(address: number, value: number, bits: X86BitsMode): number {
    const {miscellaneousReg} = this.externalRegs;
    if (!miscellaneousReg.ramEnable)
      return null;

    return null;
  }


  /**
   * @todo Add read from VRAM
   *
   * @param {number} address
   * @param {X86BitsMode} bits
   * @returns {number}
   * @memberof VGA
   */
  readUInt(address: number, bits: X86BitsMode): number {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
