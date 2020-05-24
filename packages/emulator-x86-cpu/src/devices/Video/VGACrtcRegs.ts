import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';

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
 *
 * @export
 * @class EndHorizontalBlankingReg
 * @extends {UnionStruct}
 */
export class EndHorizontalBlankingReg extends UnionStruct {
  @bits(0, 4) endHorizontalBlanking: number;
  @bits(5, 6) displayEnableSkew: number;
  @bits(7) evra: number;
}

/**
 * End Horizontal Retrace Register (Index 05h)
 *
 * @export
 * @class EndHorizontalRetraceReg
 * @extends {UnionStruct}
 */
export class EndHorizontalRetraceReg extends UnionStruct {
  @bits(0, 4) endHorizontalRetrace: number;
  @bits(5, 6) horizontalRetraceSkew: number;
  @bits(7) ehb5: number;
}

/**
 * Overflow Register (Index 07h)
 *
 * @export
 * @class OverflowReg
 * @extends {UnionStruct}
 */
export class OverflowReg extends UnionStruct {
  @bits(0) vt8: number;
  @bits(1) vde8: number;
  @bits(2) vrs8: number;
  @bits(3) svg8: number;
  @bits(4) lc8: number;
  @bits(5) vt9: number;
  @bits(6) vde9: number;
  @bits(7) vrs9: number;
}

/**
 * Preset Row Scan Register (Index 08h)
 *
 * @export
 * @class PresetRowScanReg
 * @extends {UnionStruct}
 */
export class PresetRowScanReg extends UnionStruct {
  @bits(0, 4) presetRowScan: number;
  @bits(5, 6) bytePanning: number;
}

/**
 * Maximum Scan Line Register (Index 09h)
 *
 * @export
 * @class MaxScanLineReg
 * @extends {UnionStruct}
 */
export class MaxScanLineReg extends UnionStruct {
  @bits(0, 4) maxScanLine: number;
  @bits(5) svb9: number;
  @bits(6) lc9: number;
  @bits(7) sd: number;
}

/**
 * Cursor Start Register (Index 0Ah)
 *
 * @export
 * @class CursorStartReg
 * @extends {UnionStruct}
 */
export class CursorStartReg extends UnionStruct {
  @bits(0, 4) cursorScanLineStart: number;
  @bits(5) cd: number;
}

/**
 * Cursor End Register (Index 0Bh)
 *
 * @export
 * @class CursorEndReg
 * @extends {UnionStruct}
 */
export class CursorEndReg extends UnionStruct {
  @bits(0, 4) cursorScanLineEnd: number;
  @bits(5, 6) cursorSkew: number;
}

/**
 * Start Address High Register (Index 0Ch)
 * Start Address Low Register (Index 0Dh)
 *
 * @export
 * @class StartAddressReg
 * @extends {UnionStruct}
 */
export class StartAddressReg extends UnionStruct {
  @bits(0, 7) low: number;
  @bits(8, 15) high: number;
}

/**
 * Cursor Location High Register (Index 0Eh)
 * Cursor Location Low Register (Index 0Fh)
 *
 * @export
 * @class CursorLocationReg
 * @extends {UnionStruct}
 */
export class CursorLocationReg extends UnionStruct {
  @bits(0, 7) low: number;
  @bits(8, 15) high: number;
}

/**
 * Underline Location Register (Index 14h)
 *
 * @export
 * @class UnderlineLocationReg
 * @extends {UnionStruct}
 */
export class UnderlineLocationReg extends UnionStruct {
  @bits(0, 4) underlineLocation: number;
  @bits(5) div4: number;
  @bits(6) dw: number;
}

/**
 * CRTC Mode Control Register (Index 17h)
 *
 * @export
 * @class CRTCModeControlReg
 * @extends {UnionStruct}
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

export class VGACrtcRegs {
  horizontalTotalReg = 0x0; /* Index 00h */
  endHorizontalDisplayReg = 0x0; /* Index 01h */
  startHorizontalBlankingReg = 0x0; /* Index 02h */
  endHorizontalBlankingReg = new EndHorizontalBlankingReg; /* Index 03h */
  startHorizontalRetraceReg = 0x0; /* Index 04h */
  endHorizontalRetraceReg = new EndHorizontalRetraceReg; /* Index 05h */
  verticalTotalReg = 0x0; /* Index 06h */
  overflowReg = new OverflowReg; /* Index 07h */
  presetRowScanReg = new PresetRowScanReg; /* Index 08h */
  maxScanLineReg = new MaxScanLineReg; /* Index 09h */
  cursorStartReg = new CursorStartReg; /* Index 0Ah */
  cursorEndReg = new CursorEndReg; /* Index 0Bh */
  startAddress = new StartAddressReg; /* Index 0Ch, 0Dh */
  cursorLocation = new CursorLocationReg; /* Index 0Eh, 0Fh */
  verticalRetraceStartReg = 0x0; /* Index 10h */
  verticalRetraceEndReg = 0x0; /* Index 11h */
  verticalDisplayEndReg = 0x0; /* Index 12h */
  offsetReg = 0x0; /* Index 13h */
  underlineLocation = new UnderlineLocationReg; /* Index 14h */
  startVerticalBlankingReg = 0x0; /* Index 15h */
  endVerticalBlankingReg = 0x0; /* Index 16h */
  crtcModeControlReg = new CRTCModeControlReg; /* Index 17h */
  lineCompareReg = 0x0; /* Index 18h */
}
