import * as R from 'ramda';
import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';

/** @see {@link http://www.osdever.net/FreeVGA/vga/attrreg.htm} */

/**
 * Attribute Address Register(3C0h)
 *
 * @export
 * @class AttributeAddressReg
 * @extends {UnionStruct}
 */
export class AttributeAddressReg extends UnionStruct {
  @bits(0, 4) attrAddress: number;
  @bits(5) pas: number;
}

/**
 * Attribute Mode Control Register (Index 10h)
 *
 * @export
 * @class AttributeModeControlReg
 * @extends {UnionStruct}
 */
export class AttributeModeControlReg extends UnionStruct {
  @bits(0) atge: number;
  @bits(1) mono: number;
  @bits(2) lge: number;
  @bits(3) blink: number;
  @bits(5) ppm: number;
  @bits(6) bit8: number;
  @bits(7) p54s: number;
}

/**
 * Color Plane Enable Register (Index 12h)
 *
 * @export
 * @class ColorPlaneEnableReg
 * @extends {UnionStruct}
 */
export class ColorPlaneEnableReg extends UnionStruct {
  @bits(0, 3) colorPlaneEnable: number;
}

/**
 * Horizontal Pixel Panning Register (Index 13h)
 *
 * @export
 * @class HorizontalPixelPanningReg
 * @extends {UnionStruct}
 */
export class HorizontalPixelPanningReg extends UnionStruct {
  @bits(0, 3) pixelShiftCount: number;
}

/**
 * Color Select Register (Index 14h)
 *
 * @export
 * @class ColorSelectReg
 * @extends {UnionStruct}
 */
export class ColorSelectReg extends UnionStruct {
  @bits(0, 1) colorSelect54: number;
  @bits(2, 3) colorSelect76: number;
}

/**
 * Group of VGA Attribute regs
 *
 * @export
 * @class VGAAttrRegs
 */
export class VGAAttrRegs {
  attrAddressReg = new AttributeAddressReg;
  paletteRegs: number[] = R.repeat(0, 16); /* Palette Registers (Index 00-0Fh) */
  attrModeControlReg = new AttributeModeControlReg;
  overscanColorReg: number = 0;
  colorPlaneEnableReg = new ColorPlaneEnableReg;
  horizontalPixelPanningReg = new HorizontalPixelPanningReg;
  colorSelectReg = new ColorSelectReg;

  isBlinkEnabled() {
    return this.attrModeControlReg.blink === 1;
  }
}
