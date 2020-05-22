import * as R from 'ramda';

import {uuidX86Device, X86BitsMode} from '../../types';

import {VirtualMemBlockDriver} from '../../memory/VirtualMemBlockDriver';
import {ByteMemRegionAccessor} from '../../memory/MemoryRegion';
import {X86CPU} from '../../X86CPU';

import {VGAExternalRegs, MiscellaneousReg} from './VGAExternalRegs';
import {VGACrtcRegs} from './VGACrtcRegs';
import {VGADacRegs} from './VGADacRegs';
import {VGASequencerRegs} from './VGASequencerRegs';
import {
  VGAGraphicsRegs,
  MemoryMapSelectType,
} from './VGAGraphicsRegs';

import {
  GRAPHICS_MEMORY_MAPS,
  GRAPHICS_RESERVED_MEM_MAP,
  VGA_BANK_SIZE,
  VGA_BUFFER_SIZE,
  VGA_TOTAL_PLANES,
  VGA_PIXEL_MEM_MAP,
} from './VGAConstants';

type VGA256State = {
  palette: Int32Array,
};

/**
 * Basic graphics device
 *
 * @see {@link https://github.com/copy/v86/blob/master/src/vga.js}
 *
 * @export
 * @abstract
 * @class VGA
 * @extends {uuidX86Device<X86CPU>('vga')}
 */
export class VGA extends uuidX86Device<X86CPU>('vga') implements ByteMemRegionAccessor {
  private vga256: VGA256State;

  /* graphics buffers */
  private vgaBuffer: VirtualMemBlockDriver;
  private planes: Uint8Array[];
  private pixelBuffer: Uint8Array;

  private textMode: boolean;
  private latchDword: number;

  /* regs */
  private externalRegs: VGAExternalRegs;
  private graphicsRegs: VGAGraphicsRegs;
  private crtcRegs: VGACrtcRegs;
  private dacRegs: VGADacRegs;
  private sequencerRegs: VGASequencerRegs;

  /**
   * Allocates memory, creates regsiters
   *
   * @memberof VideoAdapter
   */
  init() {
    this.reset();
  }

  /**
   * Resets values inside regs
   *
   * @memberof VGA
   */
  reset() {
    this.externalRegs = new VGAExternalRegs;
    this.graphicsRegs = new VGAGraphicsRegs;
    this.crtcRegs = new VGACrtcRegs;
    this.dacRegs = new VGADacRegs;
    this.sequencerRegs = new VGASequencerRegs;

    /* Buffers */
    this.vgaBuffer = VirtualMemBlockDriver.alloc(VGA_BUFFER_SIZE);
    this.pixelBuffer = new Uint8Array(this.vgaBuffer.device, VGA_PIXEL_MEM_MAP.low, VGA_PIXEL_MEM_MAP.size);
    this.planes = R.times(
      (index) => new Uint8Array(this.vgaBuffer.device, index * VGA_BANK_SIZE, VGA_BANK_SIZE),
      VGA_TOTAL_PLANES,
    );

    /* Colors */
    this.vga256 = {
      palette: new Int32Array(256),
    };

    /* Setting regs */
    const {dacRegs, sequencerRegs} = this;
    const {miscellaneousReg} = this.externalRegs;

    Object.assign(
      miscellaneousReg,
      <MiscellaneousReg> {
        ramEnable: 1,
        inOutAddressSelect: 1,
        oddEvenPageSelect: 0,
        hsyncPolarity: 1,
        vsyncPolarity: 1,
      },
    );

    /* DAC */
    dacRegs.writeAddressReg = 0x0;
    dacRegs.readAddressReg = 0x0;
    dacRegs.stateReg.number = 0x0;
    dacRegs.dataReg.number = 0x0;

    /* SEQUENCER */
    sequencerRegs.clockingModeReg.number = 0;
    sequencerRegs.sequencerMemModeReg.number = 0;

    /* OTHER */
    this.textMode = true;
    this.latchDword = 0x0;
  }

  /**
   * Get current CPU mapped mem region
   *
   * @readonly
   * @type {MemoryMapSelectType}
   * @memberof VGA
   */
  get memoryMapSelect(): MemoryMapSelectType {
    return this.graphicsRegs.miscellaneousGraphicsReg.memoryMapSelect;
  }

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

    const {memoryMapSelect, textMode} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    const offset = address - mode.low;
    if (textMode) {
      this.writeTextMode(offset, value);
      return 1;
    }

    return null;
  }

  /**
   * Writes single character to text memory
   *
   * @param {number} address
   * @param {number} byte
   * @memberof VGA
   */
  writeTextMode(address: number, byte: number): void {
    this.vgaBuffer[address] = byte;
  }

  /**
   * Read value from vram
   *
   * @param {number} address
   * @param {X86BitsMode} bits
   * @returns {number}
   * @memberof VGA
   */
  readUInt(address: number, bits: X86BitsMode): number {
    if (!GRAPHICS_RESERVED_MEM_MAP.contains(address, bits))
      return null;

    const {memoryMapSelect, textMode} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    const offset = address - mode.low;
    if (textMode)
      return this.readTextMode(offset);

    return null;
  }

  /**
   * Reads single byte from text mem
   *
   * @param {number} address
   * @returns {number}
   * @memberof VGA
   */
  readTextMode(address: number): number {
    return this.vgaBuffer[address];
  }
}
