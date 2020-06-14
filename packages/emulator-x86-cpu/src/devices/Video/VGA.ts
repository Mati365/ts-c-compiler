import * as R from 'ramda';

import {Size, RGBColor, Vec2D} from '@compiler/core/types';
import {reverseByte} from '@compiler/core/utils/bits';

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
  VGA_CHARSET_SIZE,
  VGA_CHAR_BYTE_SIZE,
  GRAPHICS_ALU_OPS,
  VGA_CHARSET_BANK_SIZE,
  VGAFontPack,
  GraphicsWriteMode,
} from './VGAConstants';

import {
  // VGA_TEXT_MODES_PRESET,
  VGA_GRAPHICS_MODES_PRESET,
  VGA_8X16_FONT,
  assignPresetToVGA,
  VGA256Palette,
} from './VGAModesPresets';

import {
  VGACanvasRenderer,
  VGATextModeCanvasRenderer,
  VGAGraphicsModeCanvasRenderer,
  VGAPixBufCanvasRenderer,
} from './Renderers';

type VGAMeasuredState = {
  size: Size;
};

type VGATextModeState = VGAMeasuredState & {
  charSize: Size,
};

type VGAGraphicsModeState = VGAMeasuredState & {
  virtualSize: Size,
};

class VGA256State {
  constructor(
    public palette: RGBColor[] = VGA256Palette,
  ) {}
}

/**
 * Basic graphics device
 *
 * @see {@link https://github.com/awesomekling/computron/blob/master/hw/vga.cpp}
 * @see {@link https://github.com/copy/v86/blob/master/src/vga.js}
 * @see {@link https://github.com/asmblah/jemul8/blob/feature/acceptance/js/core/classes/iodev/vga.js}
 *
 * @export
 * @abstract
 * @class VGA
 * @extends {uuidX86Device<X86CPU>('vga')}
 */
export class VGA extends uuidX86Device<X86CPU>('vga') implements ByteMemRegionAccessor {
  /* DOM */
  private screenElement: HTMLElement;

  /* VGA buffers */
  private vga256: VGA256State;
  private latch: number;

  private renderer: VGACanvasRenderer;
  private renderers: VGACanvasRenderer[];

  /* size */
  private pixelScreenSize: Size = new Size(0, 0);
  private textModeState: VGATextModeState;
  private graphicsModeState: VGAGraphicsModeState;

  /* graphics buffers */
  private vgaBuffer: VirtualMemBlockDriver;
  private planes: Uint8Array[];
  private pixelBuffer: Uint8Array;

  /* regs */
  externalRegs: VGAExternalRegs;
  graphicsRegs: VGAGraphicsRegs;
  crtcRegs: VGACrtcRegs;
  dacRegs: VGADacRegs;
  sequencerRegs: VGASequencerRegs;
  attrRegs: VGAAttrRegs;

  /**
   * Getters used only in text mode
   */
  get textMem() { return this.planes[0]; }
  get textAttrsMem() { return this.planes[1]; }
  get textFontMem() { return this.planes[2]; }

  /**
   * Allocates memory, creates regsiters
   *
   * @memberof VideoAdapter
   */
  init() {
    this.reset();
  }

  getPlanes(): Uint8Array[] { return this.planes; }
  getPixelBuffer(): Uint8Array { return this.pixelBuffer; }

  getPixelScreenSize(): Readonly<Size> { return this.pixelScreenSize; }
  getGraphicsModeState(): Readonly<VGAGraphicsModeState> { return this.graphicsModeState; }
  getVGA256State(): Readonly<VGA256State> { return this.vga256; }
  getCurrentRenderer(): VGACanvasRenderer { return this.renderer; }

  getScreenElement(): HTMLElement { return this.screenElement; }
  setScreenElement(screenElement: HTMLElement): void {
    this.screenElement = screenElement;
    this.matchPixBufRenderer();
  }

  /**
   * Text mode attributes
   */
  getTextModeState(): Readonly<VGATextModeState> { return this.textModeState; }

  setCursorLocation(vec: Vec2D): void {
    const {textModeState, crtcRegs} = this;

    crtcRegs.cursorLocation.number = (vec.y + 1) * textModeState.size.w + vec.x;
  }

  getTextCursorLocation(): Vec2D {
    const {textModeState, crtcRegs} = this;
    const cursorAddress = crtcRegs.cursorLocation.number;

    return new Vec2D(
      cursorAddress % textModeState.size.w,
      Math.floor(cursorAddress / textModeState.size.w) - 1,
    );
  }

  /**
   * Graphics mode attributes
   */
  getAddressShiftCount(): number {
    const {
      attrRegs,
      crtcRegs: {
        underlineLocation,
        crtcModeControlReg,
      },
    } = this;

    let shift = 0x80;

    shift += ~underlineLocation.number & crtcModeControlReg.number & 0x40;
    shift -= underlineLocation.number & 0x40;
    shift -= attrRegs.attrModeControlReg.number & 0x40;

    return shift >>> 6;
  }

  getBytesPerLine(): number {
    const {
      crtcRegs: {
        offsetReg,
        underlineLocation,
        crtcModeControlReg,
      },
    } = this;

    let bytes = offsetReg << 2;

    if (underlineLocation.dw)
      bytes <<= 1;
    else if (crtcModeControlReg.wordByte)
      bytes >>>= 1;

    return bytes;
  }

  getStartAddress(): number {
    const {crtcRegs} = this;

    return crtcRegs.startAddress.number;
  }

  /**
   * Iterates over pix buf renderers and takes first which matches
   *
   * @memberof VGA
   */
  matchPixBufRenderer() {
    if (!this.screenElement)
      return;

    // initialize pixel buffers on first call
    if (!this.renderers) {
      this.renderers = [
        new VGATextModeCanvasRenderer(this),
        new VGAGraphicsModeCanvasRenderer(this),
      ];
    }

    // search in list
    const newRenderer = this.renderers.find(
      (renderer) => renderer.isSuitable(),
    );

    /* eslint-disable no-unused-expressions */
    if (newRenderer !== this.renderer) {
      this.renderer?.release();

      this.renderer = newRenderer;
      this.renderer.alloc();
    }
    /* eslint-enable no-unused-expressions */
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

    /* Other */
    this.vga256 = new VGA256State;
    this.latch = 0;

    this.textModeState = {
      size: new Size(0, 0),
      charSize: new Size(0, 0),
    };

    this.graphicsModeState = {
      size: new Size(0, 0),
      virtualSize: new Size(0, 0),
    };

    /* Load post boot mode preset */
    // this.loadModePreset(VGA_TEXT_MODES_PRESET['80x25']);
    this.loadModePreset(VGA_GRAPHICS_MODES_PRESET['320x200x256']);
  }

  /**
   * Loads preset stores in VGA_TEXT_MODES_PRESET / VGA_GRAPHICS_MODES_PRESET
   *
   * @param {number[]} preset
   * @memberof VGA
   */
  loadModePreset(preset: number[]): void {
    assignPresetToVGA(this, preset);

    // Post reset callbacks
    this.allocPlanesBuffers();
    this.measureMode();
    this.matchPixBufRenderer();

    // load predefined data for VGA Text mode
    if (this.textMode)
      this.loadTextModeDefaults();
  }

  /**
   * Loads some default binaries into text mode mem
   *
   * @private
   * @memberof VGA
   */
  private loadTextModeDefaults(): void {
    const {textModeState: {size}, textAttrsMem} = this;

    this.writeFontPack(VGA_8X16_FONT);

    // set default foreground color
    for (let i = 0; i < size.w * size.h; ++i)
      textAttrsMem[i] = 0x7;
  }

  /**
   * Writes VGA text font into plane 2
   *
   * @see {@link https://files.osdev.org/mirrors/geezer/osd/graphics/modes.c}
   *
   * @param {VGAFontPack} font
   * @param {number} [fontIndex=0]
   * @memberof VGA
   */
  writeFontPack(font: VGAFontPack, fontIndex: number = 0): void {
    const {charSize: {h: charH}, data} = font;
    const plane = this.planes[2];
    const fontOffset = fontIndex * VGA_CHARSET_BANK_SIZE;

    for (let charIndex = 0; charIndex < VGA_CHARSET_SIZE; ++charIndex) {
      for (let row = 0; row < charH; ++row) {
        const charDestOffset = fontOffset + VGA_CHAR_BYTE_SIZE * charIndex + row;
        const charTemplateOffset = charH * charIndex + row;

        plane[charDestOffset] = reverseByte(data[charTemplateOffset]);
      }
    }
  }

  /**
   * Creates VRAM buffers / planes
   *
   * @private
   * @memberof VGA
   */
  private allocPlanesBuffers() {
    this.vgaBuffer = VirtualMemBlockDriver.alloc(VGA_BUFFER_SIZE);
    this.pixelBuffer = new Uint8Array(this.vgaBuffer.device.buffer, VGA_PIXEL_MEM_MAP.low, VGA_PIXEL_MEM_MAP.size - 1);
    this.planes = R.times(
      (index) => new Uint8Array(this.vgaBuffer.device.buffer, index * VGA_BANK_SIZE, VGA_BANK_SIZE),
      VGA_TOTAL_PLANES,
    );
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
      graphicsModeState, pixelScreenSize,
      crtcRegs, attrRegs, sequencerRegs,
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
      const {maxScanLineReg} = crtcRegs;
      const {sd, maxScanLine} = maxScanLineReg;

      // doubling
      if (sd)
        verticalScans >>>= 1;

      // sets size
      textModeState.size.w = horizontalCharacters;
      textModeState.size.h = verticalScans / (1 + maxScanLine) | 0;

      // sets single character size
      // 1 if 8 dots mode
      textModeState.charSize.w = 9 - sequencerRegs.clockingModeReg.dotMode8or9;
      textModeState.charSize.h = maxScanLine + 1;

      // calculates total canvas size
      pixelScreenSize.w = textModeState.charSize.w * textModeState.size.w;
      pixelScreenSize.h = textModeState.charSize.h * textModeState.size.h;
    } else {
      // graphics mode
      const screenSize = new Size(
        horizontalCharacters << 3,
        this.scanLineToRow(verticalScans),
      );

      const virtualSize = new Size(
        crtcRegs.offsetReg << 4,
        Math.ceil(GRAPHICS_MEMORY_MAPS[0b00].size / this.getBytesPerLine()),
      );

      if (attrRegs.attrModeControlReg.bit8) {
        screenSize.w >>>= 1;
        virtualSize.w >>>= 1;
      }

      graphicsModeState.size.assign(screenSize);
      graphicsModeState.virtualSize.assign(virtualSize);
      pixelScreenSize.assign(screenSize);
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

    /** GRAPHICAL MODE */
    this.writeGraphicsMode(offset, value);
    return 1;
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

    const {memoryMapSelect, planes, vgaBuffer} = this;
    const mode = GRAPHICS_MEMORY_MAPS[memoryMapSelect];
    if (!mode.contains(address))
      return null;

    let offset = address - mode.low;

    /** TEXT MODE */
    if (this.textMode)
      return this.readTextMode(offset);

    /** GRAPHICS MODE */
    this.latch = (
      planes[0][offset]
        | (planes[1][offset] << 8)
        | (planes[2][offset] << 16)
        | (planes[3][offset] << 24)
    );

    const {memModeReg} = this.sequencerRegs;
    const {
      readMapSelectReg,
      graphicsModeReg,
      colorDontCareReg,
    } = this.graphicsRegs;

    // read mode 1
    if (graphicsModeReg.readMode) {
      const {colorDontCare} = colorDontCareReg;
      let data = 0xFF;

      if (colorDontCare & 0x1) data &= planes[0][offset] ^ ~(colorDontCare & 0x1 ? 0xFF : 0x00);
      if (colorDontCare & 0x2) data &= planes[1][offset] ^ ~(colorDontCare & 0x2 ? 0xFF : 0x00);
      if (colorDontCare & 0x4) data &= planes[2][offset] ^ ~(colorDontCare & 0x4 ? 0xFF : 0x00);
      if (colorDontCare & 0x8) data &= planes[3][offset] ^ ~(colorDontCare & 0x8 ? 0xFF : 0x00);

      return data;
    }

    // read mode 0
    let plane = readMapSelectReg.readMapSelect;
    if (memModeReg.chain4) {
      plane = offset & 0x3;
      offset &= ~0x3;
    } else if (graphicsModeReg.hostOddEvenMemoryReadAddrEnable) {
      plane = offset & 0x1;
      offset &= ~0x1;
    }

    return vgaBuffer.device[(plane << 16) | offset];
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
      planes[0][address >> 1] = byte;
    else
      planes[1][(address - 1) >> 1] = byte;
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
      return planes[0][address >> 1];

    return planes[1][(address - 1) >> 1];
  }

  /**
   * Repeats 8 bit number 4 times in 32 number
   *
   * @static
   * @param {number} byte
   * @returns {number}
   * @memberof VGA
   */
  static repeatByteInDword(byte: number): number {
    return (
      byte
        | (byte << 8)
        | (byte << 16)
        | (byte << 24)
    );
  }

  /**
   * Watches bits 0 to 3, each bit is 0xFF in output
   * so:
   * 0b11 => 0xFF_FF, 0b111 => 0xFF_FF_FF
   *
   * @static
   * @param {number} byte
   * @returns {number}
   * @memberof VGA
   */
  static applyExpand(byte: number): number {
    let dword = byte & 0x1 ? 0xFF : 0x00;

    dword |= (byte & 0x2 ? 0xFF : 0x00) << 8;
    dword |= (byte & 0x4 ? 0xFF : 0x00) << 16;
    dword |= (byte & 0x8 ? 0xFF : 0x00) << 24;

    return dword;
  }

  /**
   * Barrel Shifter
   *
   * @see {@link http://www.phatcode.net/res/224/files/html/ch25/25-01.html#Heading3}
   * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#03}
   *
   * @param {number} byte
   * @returns {number}
   * @memberof VGA
   */
  applyGraphicsRegRotate(byte: number): number {
    const {rotateCount} = this.graphicsRegs.dataRotateReg;

    const wrapped = byte | (byte << 8);
    const count = rotateCount & 0x7;
    const shifted = wrapped >>> count;

    return shifted & 0xFF;
  }

  /**
   * Set / Reset Circuitry
   *
   * @see {@link http://www.phatcode.net/res/224/files/html/ch25/25-03.html#Heading5}
   * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#00}
   *
   * @param {number} value
   * @returns {number}
   * @memberof VGA
   */
  applySetResetReg(value: number): number {
    const {
      graphicsRegs: {
        enableSetResetReg,
        setResetReg,
      },
    } = this;

    const setResetDword = VGA.applyExpand(setResetReg.number);
    const enableSetResetDword = VGA.applyExpand(enableSetResetReg.number);

    value |= enableSetResetDword & setResetDword;
    value &= ~enableSetResetDword | setResetDword;

    return value;
  }

  /**
   * Perform logical operation based on dataRotateReg. ALU unit
   *
   * @param {number} value
   * @returns {number}
   * @memberof VGA
   */
  applyLogicalReg(value: number): number {
    const {latch} = this;
    const {logicalOperation} = this.graphicsRegs.dataRotateReg;

    return GRAPHICS_ALU_OPS[logicalOperation](value, latch);
  }

  /**
   * Apply bitmask value from reg to value and latch
   *
   * @param {number} bitmask
   * @param {number} value
   * @returns {number}
   * @memberof VGA
   */
  applyLatchBitmask(bitmask: number, value: number): number {
    const {latch} = this;

    return (bitmask & value) | (~bitmask & latch);
  }

  /**
   * Converts vga address to offset in pixel buffer
   *
   * @private
   * @param {number} address
   * @returns {number}
   * @memberof VGA
   */
  private vgaAddressToPixAddress(address: number): number {
    const shiftCount = this.getAddressShiftCount();
    const {
      crtcRegs: {
        crtcModeControlReg,
      },
    } = this;

    if (~crtcModeControlReg.number & 0x3) {
      const {graphicsModeState: {virtualSize}} = this;
      const startAddress = this.getStartAddress();

      let pixelAddr = address - startAddress;

      pixelAddr &= (crtcModeControlReg.number << 13) | ~0x6000;
      pixelAddr <<= shiftCount;

      // Decompose address
      let row = pixelAddr / virtualSize.w | 0;
      const col = pixelAddr % virtualSize.w;

      switch (crtcModeControlReg.number & 0x3) {
        case 0x2: row = (row << 1) | ((address >> 13) & 0x1); break;
        case 0x1: row = (row << 1) | ((address >> 14) & 0x1); break;
        case 0x0: row = (row << 2) | ((address >> 13) & 0x3); break;

        default:
      }

      return row * virtualSize.w + col + (startAddress << shiftCount);
    }

    return address << shiftCount;
  }

  /**
   * Write to memory in graphical mode
   *
   * @see {@link https://github.com/copy/v86/blob/master/src/vga.js#L681}
   * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#05}
   *
   * @param {number} address
   * @param {number} byte
   * @memberof VGA
   */
  writeGraphicsMode(address: number, byte: number): void {
    const {
      renderer,
      planes,
      latch,
      sequencerRegs: {
        memModeReg,
        mapMaskReg,
      },
      graphicsRegs: {
        graphicsModeReg,
        colorBitmaskReg,
        setResetReg,
      },
    } = this;

    const {writeMode} = graphicsModeReg;
    let bitmask = VGA.repeatByteInDword(colorBitmaskReg.bitmask);

    // choose write value
    let outputDword: number = 0x0;
    switch (writeMode) {
      case GraphicsWriteMode.MODE_0:
        outputDword = this.applyGraphicsRegRotate(byte);
        outputDword = VGA.repeatByteInDword(outputDword);
        outputDword = this.applySetResetReg(outputDword);
        outputDword = this.applyLogicalReg(outputDword);
        outputDword = this.applyLatchBitmask(bitmask, outputDword);
        break;

      case GraphicsWriteMode.MODE_1:
        outputDword = latch;
        break;

      case GraphicsWriteMode.MODE_2:
        outputDword = VGA.applyExpand(byte);
        outputDword = this.applyLogicalReg(outputDword);
        outputDword = this.applyLatchBitmask(bitmask, outputDword);
        break;

      case GraphicsWriteMode.MODE_3:
        bitmask &= VGA.repeatByteInDword(this.applyGraphicsRegRotate(byte));
        outputDword = VGA.applyExpand(setResetReg.number);
        outputDword = this.applyLatchBitmask(bitmask, outputDword);
        break;

      default:
        console.warn(`VGA: unsupported write mode ${writeMode}!`);
    }

    // plane index select
    let planeSelect = 0xF;
    const {oddEventHostMemWriteAddressDisable, chain4} = memModeReg;

    if (oddEventHostMemWriteAddressDisable === 0x0) {
      planeSelect = 0x5 << (address & 0x1);
      address &= ~0x1;
    } else if (chain4) {
      planeSelect = 1 << (address & 0x3);
      address &= ~0x3;
    }

    // See: http://www.osdever.net/FreeVGA/vga/seqreg.htm#02
    planeSelect &= mapMaskReg.memPlaneWriteEnable;

    // write to mem
    if (planeSelect & 0x1) planes[0][address] = (outputDword >> 0) & 0xFF;
    if (planeSelect & 0x2) planes[1][address] = (outputDword >> 8) & 0xFF;
    if (planeSelect & 0x4) planes[2][address] = (outputDword >> 16) & 0xFF;
    if (planeSelect & 0x8) planes[3][address] = (outputDword >> 24) & 0xFF;

    // mark renderer region as dirty
    const pixelAddress = this.vgaAddressToPixAddress(address);
    (<VGAPixBufCanvasRenderer> renderer).markRegionAsDirty(pixelAddress, pixelAddress + 0x8);
  }
}
