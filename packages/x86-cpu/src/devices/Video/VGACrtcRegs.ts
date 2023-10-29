import { UnionStruct, bits } from '@ts-c-compiler/core';
import { VGAIndexedReg } from './VGAConstants';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/crtcreg.htm}
 *
 * Index 00h -- Horizontal Total Register
 * Index 01h -- End Horizontal Display Register
 * Index 02h -- Start Horizontal Blanking Register
 * Index 03h -- End Horizontal Blanking Register
 * Index 04h -- Start Horizontal Retrace Register
 * Index 05h -- End Horizontal Retrace Register
 * Index 06h -- Vertical Total Register
 * Index 07h -- Overflow Register
 * Index 08h -- Preset Row Scan Register
 * Index 09h -- Maximum Scan Line Register
 * Index 0Ah -- Cursor Start Register
 * Index 0Bh -- Cursor End Register
 * Index 0Ch -- Start Address High Register
 * Index 0Dh -- Start Address Low Register
 * Index 0Eh -- Cursor Location High Register
 * Index 0Fh -- Cursor Location Low Register
 * Index 10h -- Vertical Retrace Start Register
 * Index 11h -- Vertical Retrace End Register
 * Index 12h -- Vertical Display End Register
 * Index 13h -- Offset Register
 * Index 14h -- Underline Location Register
 * Index 15h -- Start Vertical Blanking Register
 * Index 16h -- End Vertical Blanking
 * Index 17h -- CRTC Mode Control Register
 * Index 18h -- Line Compare Register
 */

/**
 * End Horizontal Blanking Register (Index 03h)
 */
export class EndHorizontalBlankingReg extends UnionStruct {
  @bits(0, 4) endHorizontalBlanking: number;
  @bits(5, 6) displayEnableSkew: number;
  @bits(7) evra: number;
}

/**
 * End Horizontal Retrace Register (Index 05h)
 */
export class EndHorizontalRetraceReg extends UnionStruct {
  @bits(0, 4) endHorizontalRetrace: number;
  @bits(5, 6) horizontalRetraceSkew: number;
  @bits(7) ehb5: number;
}

/**
 * Overflow Register (Index 07h)
 */
export class OverflowReg extends UnionStruct {
  @bits(0) vt8: number;
  @bits(1) vde8: number;
  @bits(2) vrs8: number;
  @bits(3) svb8: number;
  @bits(4) lc8: number;
  @bits(5) vt9: number;
  @bits(6) vde9: number;
  @bits(7) vrs9: number;
}

/**
 * Preset Row Scan Register (Index 08h)
 */
export class PresetRowScanReg extends UnionStruct {
  @bits(0, 4) presetRowScan: number;
  @bits(5, 6) bytePanning: number;
}

/**
 * Maximum Scan Line Register (Index 09h)
 */
export class MaxScanLineReg extends UnionStruct {
  @bits(0, 4) maxScanLine: number;
  @bits(5) svb9: number;
  @bits(6) lc9: number;
  @bits(7) sd: number;
}

/**
 * Cursor Start Register (Index 0Ah)
 */
export class CursorStartReg extends UnionStruct {
  @bits(0, 4) cursorScanLineStart: number;
  @bits(5) cd: number;
}

/**
 * Cursor End Register (Index 0Bh)
 */
export class CursorEndReg extends UnionStruct {
  @bits(0, 4) cursorScanLineEnd: number;
  @bits(5, 6) cursorSkew: number;
}

/**
 * Start Address High Register (Index 0Ch)
 * Start Address Low Register (Index 0Dh)
 */
export class StartAddressReg extends UnionStruct {
  @bits(0, 7) low: number;
  @bits(8, 15) high: number;
}

/**
 * Cursor Location High Register (Index 0Eh)
 * Cursor Location Low Register (Index 0Fh)
 */
export class CursorLocationReg extends UnionStruct {
  @bits(0, 7) low: number;
  @bits(8, 15) high: number;
}

/**
 * Underline Location Register (Index 14h)
 */
export class UnderlineLocationReg extends UnionStruct {
  @bits(0, 4) underlineLocation: number;
  @bits(5) div4: number;
  @bits(6) dw: number;
}

/**
 * CRTC Mode Control Register (Index 17h)
 */
export class CRTCModeControlReg extends UnionStruct {
  @bits(0) map13: number;
  @bits(1) map14: number;
  @bits(2) sldiv: number;
  @bits(3) div2: number;
  @bits(5) aw: number;
  @bits(6) wordByte: number;
  @bits(7) se: number;
}

/**
 * Group of CRTC regs
 */
export class VGACrtcRegs extends VGAIndexedReg {
  horizontalTotalReg = 0x0; /* Index 00h */
  endHorizontalDisplayReg = 0x0; /* Index 01h */
  startHorizontalBlankingReg = 0x0; /* Index 02h */
  endHorizontalBlankingReg = new EndHorizontalBlankingReg(); /* Index 03h */
  startHorizontalRetraceReg = 0x0; /* Index 04h */
  endHorizontalRetraceReg = new EndHorizontalRetraceReg(); /* Index 05h */
  verticalTotalReg = 0x0; /* Index 06h */
  overflowReg = new OverflowReg(); /* Index 07h */
  presetRowScanReg = new PresetRowScanReg(); /* Index 08h */
  maxScanLineReg = new MaxScanLineReg(); /* Index 09h */
  cursorStartReg = new CursorStartReg(); /* Index 0Ah */
  cursorEndReg = new CursorEndReg(); /* Index 0Bh */
  startAddress = new StartAddressReg(); /* Index 0Ch, 0Dh */
  cursorLocation = new CursorLocationReg(); /* Index 0Eh, 0Fh */
  verticalRetraceStartReg = 0x0; /* Index 10h */
  verticalRetraceEndReg = 0x0; /* Index 11h */
  verticalDisplayEndReg = 0x0; /* Index 12h */
  offsetReg = 0x0; /* Index 13h */
  underlineLocation = new UnderlineLocationReg(); /* Index 14h */
  startVerticalBlankingReg = 0x0; /* Index 15h */
  endVerticalBlankingReg = 0x0; /* Index 16h */
  crtcModeControlReg = new CRTCModeControlReg(); /* Index 17h */
  lineCompareReg = 0x0; /* Index 18h */

  isTextCursorDisabled(): boolean {
    return this.cursorStartReg.cd === 1;
  }

  setTextCursorDisabled(disabled: number | boolean) {
    this.cursorStartReg.cd = +disabled;
  }

  setTextCursorShape([scanLineStart, scanLineEnd]: [number, number]): void {
    this.cursorStartReg.cursorScanLineStart = scanLineStart;
    this.cursorEndReg.cursorScanLineEnd = scanLineEnd;
  }

  getCursorScanLineStart() {
    return this.cursorStartReg.cursorScanLineStart;
  }

  getCursorScanLineEnd() {
    return this.cursorEndReg.cursorScanLineEnd;
  }

  /**
   * Reads vertical regs that might contain overflow
   *
   * @see {@link http://www.osdever.net/FreeVGA/vga/crtcreg.htm#07}
   */
  getVerticalRetraceStart() {
    const {
      overflowReg: { vrs9, vrs8 },
      verticalRetraceStartReg,
    } = this;

    return verticalRetraceStartReg | (vrs9 << 9) | (vrs8 << 8);
  }

  getVerticalDisplayEnd() {
    const {
      overflowReg: { vde9, vde8 },
      verticalDisplayEndReg,
    } = this;

    return verticalDisplayEndReg | (vde9 << 9) | (vde8 << 8);
  }

  getVerticalTotal() {
    const {
      overflowReg: { vt9, vt8 },
      verticalTotalReg,
    } = this;

    return verticalTotalReg | (vt9 << 9) | (vt8 << 8);
  }

  getVerticalBlankingStart() {
    return this.startVerticalBlankingReg | (this.overflowReg.svb8 << 8);
  }

  getLineCompare() {
    return this.lineCompareReg | (this.overflowReg.lc8 << 8);
  }

  getRegByIndex(index: number = this.indexReg): number {
    switch (index) {
      case 0x0:
        return this.horizontalTotalReg;
      case 0x1:
        return this.endHorizontalDisplayReg;
      case 0x2:
        return this.startHorizontalBlankingReg;
      case 0x3:
        return this.endHorizontalBlankingReg.number;
      case 0x4:
        return this.startHorizontalRetraceReg;
      case 0x5:
        return this.endHorizontalRetraceReg.number;
      case 0x6:
        return this.verticalTotalReg;
      case 0x7:
        return this.overflowReg.number;
      case 0x8:
        return this.presetRowScanReg.number;
      case 0x9:
        return this.maxScanLineReg.number;
      case 0xa:
        return this.cursorStartReg.number;
      case 0xb:
        return this.cursorEndReg.number;
      case 0xc:
        return this.startAddress.high;
      case 0xd:
        return this.startAddress.low;
      case 0xe:
        return this.cursorLocation.high;
      case 0xf:
        return this.cursorLocation.low;
      case 0x10:
        return this.verticalRetraceStartReg;
      case 0x11:
        return this.verticalRetraceEndReg;
      case 0x12:
        return this.verticalDisplayEndReg;
      case 0x13:
        return this.offsetReg;
      case 0x14:
        return this.underlineLocation.number;
      case 0x15:
        return this.startVerticalBlankingReg;
      case 0x16:
        return this.endVerticalBlankingReg;
      case 0x17:
        return this.crtcModeControlReg.number;
      case 0x18:
        return this.lineCompareReg;

      default:
        console.warn(`Unknown port ${index} in VGA CRTC!`);
        return null;
    }
  }

  setRegByIndex(value: number, index: number = this.indexReg): void {
    switch (index) {
      case 0x0:
        this.horizontalTotalReg = value;
        break;
      case 0x1:
        this.endHorizontalDisplayReg = value;
        break;
      case 0x2:
        this.startHorizontalBlankingReg = value;
        break;
      case 0x3:
        this.endHorizontalBlankingReg.number = value;
        break;
      case 0x4:
        this.startHorizontalRetraceReg = value;
        break;
      case 0x5:
        this.endHorizontalRetraceReg.number = value;
        break;
      case 0x6:
        this.verticalTotalReg = value;
        break;
      case 0x7:
        this.overflowReg.number = value;
        break;
      case 0x8:
        this.presetRowScanReg.number = value;
        break;
      case 0x9:
        this.maxScanLineReg.number = value;
        break;
      case 0xa:
        this.cursorStartReg.number = value;
        break;
      case 0xb:
        this.cursorEndReg.number = value;
        break;
      case 0xc:
        this.startAddress.high = value;
        break;
      case 0xd:
        this.startAddress.low = value;
        break;
      case 0xe:
        this.cursorLocation.high = value;
        break;
      case 0xf:
        this.cursorLocation.low = value;
        break;
      case 0x10:
        this.verticalRetraceStartReg = value;
        break;
      case 0x11:
        this.verticalRetraceEndReg = value;
        break;
      case 0x12:
        this.verticalDisplayEndReg = value;
        break;
      case 0x13:
        this.offsetReg = value;
        break;
      case 0x14:
        this.underlineLocation.number = value;
        break;
      case 0x15:
        this.startVerticalBlankingReg = value;
        break;
      case 0x16:
        this.endVerticalBlankingReg = value;
        break;
      case 0x17:
        this.crtcModeControlReg.number = value;
        break;
      case 0x18:
        this.lineCompareReg = value;
        break;
      default:
    }
  }
}
