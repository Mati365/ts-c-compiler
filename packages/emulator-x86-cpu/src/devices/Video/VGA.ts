import * as R from 'ramda';

import {Size} from '@compiler/core/types';
import {uuidX86Device} from '../../types';

import {VirtualMemBlockDriver} from '../../memory/VirtualMemBlockDriver';
import {ByteMemRegionAccessor} from '../../memory/MemoryRegion';
import {X86CPU} from '../../X86CPU';

import {VGAExternalRegs} from './VGAExternalRegs';
import {VGACrtcRegs} from './VGACrtcRegs';
import {VGADacRegs} from './VGADacRegs';
import {VGASequencerRegs} from './VGASequencerRegs';
import {VGAAttrRegs} from './VGAAttrRegs';
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

import {VGA_TEXT_MODES_PRESET, assignPresetToVGA} from './VGAModesPresets';

type VGAMeasuredState = {
  size: Size;
};

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

  /* size */
  private textModeState: VGAMeasuredState;
  private graphicsModeState: VGAMeasuredState & {
    virtualSize: Size,
  };

  /* graphics buffers */
  private vgaBuffer: VirtualMemBlockDriver;
  private planes: Uint8Array[];
  private pixelBuffer: Uint8Array;

  /* regs */
  public externalRegs: VGAExternalRegs;
  public graphicsRegs: VGAGraphicsRegs;
  public crtcRegs: VGACrtcRegs;
  public dacRegs: VGADacRegs;
  public sequencerRegs: VGASequencerRegs;
  public attrRegs: VGAAttrRegs;

  /**
   * Allocates memory, creates regsiters
   *
   * @memberof VideoAdapter
   */
  init() {
    this.reset();
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
    this.attrRegs = new VGAAttrRegs;

    /* Buffers */
    this.vgaBuffer = VirtualMemBlockDriver.alloc(VGA_BUFFER_SIZE);
    this.pixelBuffer = new Uint8Array(this.vgaBuffer.device, VGA_PIXEL_MEM_MAP.low, VGA_PIXEL_MEM_MAP.size);
    this.planes = R.times(
      (index) => new Uint8Array(this.vgaBuffer.device, index * VGA_BANK_SIZE, VGA_BANK_SIZE),
      VGA_TOTAL_PLANES,
    );

    /* Other */
    this.vga256 = new VGA256State;
    this.latch = 0;

    this.textModeState = {
      size: new Size(0, 0),
    };

    this.graphicsModeState = {
      size: new Size(0, 0),
      virtualSize: new Size(0, 0),
    };

    /* Load post boot mode preset */
    this.loadModePreset(VGA_TEXT_MODES_PRESET['80x25']);

    /* Post reset callbacks */
    this.matchPixBufRenderer();
    this.measureMode();
  }

  /**
   * Loads preset stores in VGA_TEXT_MODES_PRESET / VGA_GRAPHICS_MODES_PRESET
   *
   * @param {number[]} preset
   * @memberof VGA
   */
  loadModePreset(preset: number[]): void {
    assignPresetToVGA(this, preset);
  }

  /**
   * Calculates mode size:
   * - text mode in cols / rows
   * - graphical mode in width / height (px)
   *
   * @see {@link https://github.com/copy/v86/blob/master/src/vga.js#L1164}
   *
   * @private
   * @memberof VGA
   */
  private measureMode() {
    const {
      textMode, textModeState,
      graphicsModeState,
      crtcRegs, attrRegs,
    } = this;

    const horizontalCharacters = Math.min(
      1 + crtcRegs.endHorizontalDisplayReg,
      crtcRegs.startHorizontalBlankingReg,
    );

    let verticalScans = Math.min(
      1 + crtcRegs.getVerticalDisplayEnd(),
      crtcRegs.getVerticalBlankingStart(),
    );

    if (!horizontalCharacters || !verticalScans)
      return;

    // text mode
    if (textMode) {
      // doubling
      if (crtcRegs.maxScanLineReg.sd)
        verticalScans >>>= 1;

      // sets size
      textModeState.size.w = horizontalCharacters;
      textModeState.size.h = verticalScans / (1 + (crtcRegs.maxScanLineReg.maxScanLine & 0x1F)) | 0;
    } else {
      // graphics mode
      const screenSize = new Size(
        horizontalCharacters << 3,
        this.scanLineToRow(verticalScans),
      );

      if (attrRegs.attrModeControlReg.bit8)
        screenSize.w >>= 1;

      graphicsModeState.size = screenSize;
    }
  }

  /**
   * Converts scan line to row number
   *
   * @private
   * @param {number} scanLine
   * @returns {number}
   * @memberof VGA
   */
  private scanLineToRow(scanLine: number): number {
    const {crtcRegs: {maxScanLineReg, crtcModeControlReg}} = this;

    // double scanning
    if (maxScanLineReg.sd)
      scanLine >>>= 1;

    scanLine = Math.ceil(scanLine / (1 + (maxScanLineReg.maxScanLine)));

    if (!crtcModeControlReg.map13)
      scanLine <<= 1;

    if (!crtcModeControlReg.map14)
      scanLine <<= 1;

    return scanLine;
  }

  /**
   * Called in render loop
   *
   * @see {@link https://github.com/copy/v86/blob/master/src/vga.js#L2144}
   *
   * @memberof VGA
   */
  refreshPixelBuffer(): void {}

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
   * @returns {number}
   * @memberof VGA
   */
  writeByte(address: number, value: number): number {
    if (!GRAPHICS_RESERVED_MEM_MAP.contains(address))
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
   * Read value from vram
   *
   * @param {number} address
   * @returns {number}
   * @memberof VGA
   */
  readByte(address: number): number {
    if (!GRAPHICS_RESERVED_MEM_MAP.contains(address))
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
   * Writes single character to text memory
   *
   * @see {@link http://www.scs.stanford.edu/09wi-cs140/pintos/specs/freevga/vga/vgatext.htm}
   *
   * @param {number} address
   * @param {number} byte
   * @memberof VGA
   */
  writeTextMode(address: number, byte: number): void {
    const {planes} = this;

    if (address % 2 === 0)
      planes[0][address] = byte;
    else
      planes[1][address] = byte;
  }

  /**
   * Reads single byte from text mem
   *
   * @param {number} address
   * @returns {number}
   * @memberof VGA
   */
  readTextMode(address: number): number {
    const {planes} = this;

    if (address % 2 === 0)
      return planes[0][address];

    return planes[1][address];
  }
}
