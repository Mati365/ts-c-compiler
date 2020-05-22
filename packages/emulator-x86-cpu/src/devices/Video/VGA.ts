import * as R from 'ramda';

import {uuidX86Device, X86BitsMode} from '../../types';

import {VirtualMemBlockDriver} from '../../memory/VirtualMemBlockDriver';
import {ByteMemRegionAccessor} from '../../memory/MemoryRegion';
import {X86CPU} from '../../X86CPU';

import {VGAExternalRegs, MiscReg} from './VGAExternalRegs';
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

import {
  VGAPixBufRenderer,
  VGATextModePixBufRenderer,
} from './Renderers';

class VGA256State {
  palette: Int32Array = null;
}

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
  private latch: number;

  private currentPixBufRenderer: VGAPixBufRenderer;
  private pixBufRenderers: VGAPixBufRenderer[];

  /* graphics buffers */
  private vgaBuffer: VirtualMemBlockDriver;
  private planes: Uint8Array[];
  private pixelBuffer: Uint8Array;

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
    this.matchPixBufRenderer();
  }

  /**
   * Iterates over pix buf renderers and takes first which matches
   *
   * @memberof VGA
   */
  matchPixBufRenderer() {
    // initialize pixel buffers on first call
    if (!this.pixBufRenderers) {
      this.pixBufRenderers = [
        new VGATextModePixBufRenderer(this),
      ];
    }

    // search in list
    this.currentPixBufRenderer = this.pixBufRenderers.find(
      (renderer) => renderer.isSuitable(),
    );
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

    /* Setting regs */
    const {dacRegs, sequencerRegs, graphicsRegs} = this;
    const {miscReg} = this.externalRegs;

    Object.assign(
      miscReg,
      <MiscReg> {
        ramEnable: 1,
        inOutAddressSelect: 1,
        oddEvenPageSelect: 0,
        hsyncPolarity: 1,
        vsyncPolarity: 1,
      },
    );

    /* Graphics */
    graphicsRegs.miscGraphicsReg.alphanumericModeDisable = 0x0;

    /* DAC */
    dacRegs.writeAddressReg = 0x0;
    dacRegs.readAddressReg = 0x0;
    dacRegs.stateReg.number = 0x0;
    dacRegs.dataReg.number = 0x0;

    /* SEQUENCER */
    sequencerRegs.clockingModeReg.number = 0;
    sequencerRegs.sequencerMemModeReg.number = 0;

    /* OTHER */
    this.vga256 = new VGA256State;
    this.latch = 0x0;
  }

  /**
   * Get flag if VGA is in text mode
   *
   * @readonly
   * @type {boolean}
   * @memberof VGA
   */
  get textMode(): boolean {
    return this.graphicsRegs.miscGraphicsReg.alphanumericModeDisable === 0x0;
  }

  /**
   * Get current CPU mapped mem region
   *
   * @readonly
   * @type {MemoryMapSelectType}
   * @memberof VGA
   */
  get memoryMapSelect(): MemoryMapSelectType {
    return this.graphicsRegs.miscGraphicsReg.memoryMapSelect;
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

    const {miscReg} = this.externalRegs;
    if (!miscReg.ramEnable)
      return null;

    const {memoryMapSelect} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    const offset = address - mode.low;

    /** TEXT MODE */
    if (this.textMode) {
      this.writeTextMode(offset, value);
      return 1;
    }

    /** GRAPHICS MODE */
    return null;
  }

  /**
   * Writes single character to text memory
   *
   * @see {@link http://www.scs.stanford.edu/09wi-cs140/pintos/specs/freevga/vga/vgatext.htm}
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

    const {memoryMapSelect, planes} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    const offset = address - mode.low;

    /** TEXT MODE */
    if (this.textMode)
      return this.readTextMode(offset);

    /** GRAPHICS MODE */
    this.latch = planes[0][offset] | (planes[1][offset] << 8) | (planes[2][offset] << 16) | (planes[3][offset] << 24);
    return planes[memoryMapSelect][offset];
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
