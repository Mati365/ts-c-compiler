import {uuidX86Device, X86BitsMode} from '../../types';

import {VirtualMemBlockDriver} from '../../memory/VirtualMemBlockDriver';
import {ByteMemRegionAccessor} from '../../memory/MemoryRegion';
import {X86CPU} from '../../X86CPU';

import {VGAExternalRegs} from './VGAExternalRegs';
import {VGACrtcRegs} from './VGACrtcRegs';
import {VGADacRegs} from './VGADacRegs';
import {VGASequencerRegs} from './VGASequencerRegs';
import {
  GRAPHICS_MEMORY_MAPS,
  VGAGraphicsRegs,
  MemoryMapSelectType,
  GRAPHICS_RESERVED_MEM_MAP,
} from './VGAGraphicsRegs';

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
  private crtcRegs: VGACrtcRegs;
  private dacRegs: VGADacRegs;
  private sequencerRegs: VGASequencerRegs;

  /**
   * Allocates memory
   *
   * @memberof VideoAdapter
   */
  init() {
    this.externalRegs = new VGAExternalRegs;
    this.graphicsRegs = new VGAGraphicsRegs;
    this.crtcRegs = new VGACrtcRegs;
    this.dacRegs = new VGADacRegs;
    this.sequencerRegs = new VGASequencerRegs;

    this.vram = VirtualMemBlockDriver.alloc(0x40000); // 256 KB
    this.vga256 = {
      palette: new Int32Array(256),
    };
  }

  get memoryMapSelect(): MemoryMapSelectType {
    return this.graphicsRegs.miscellaneousGraphicsReg.memoryMapSelect;
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
    if (!GRAPHICS_RESERVED_MEM_MAP.contains(address, bits))
      return null;

    const {miscellaneousReg} = this.externalRegs;
    if (!miscellaneousReg.ramEnable)
      return null;

    const {memoryMapSelect} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    const offset = address - mode.low;

    // todo: Write
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
    if (!GRAPHICS_RESERVED_MEM_MAP.contains(address, bits))
      return null;

    const {memoryMapSelect} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    // todo: Read
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
