import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';

/**
 * Misc Output Register (Read at 3CCh, Write at 3C2h)
 *
 * @see {@link http://www.osdever.net/FreeVGA/vga/extreg.htm#3CCR3C2W}
 * *
 * @export
 * @class MiscReg
 * @extends {UnionStruct}
 */
export class MiscReg extends UnionStruct {
  @bits(0) inOutAddressSelect: number;
  @bits(1) ramEnable: number;
  @bits(2, 3) clockSelect: number;
  @bits(5) oddEvenPageSelect: number; // 4th bit is not used, it is correct
  @bits(6) hsyncPolarity: number;
  @bits(7) vsyncPolarity: number;
}

/**
 * Feature Control Register (Read at 3CAh, Write at 3BAh (mono) or 3DAh (color))
 *
 * @export
 * @class FeatureControlReg
 * @extends {UnionStruct}
 */
export class FeatureControlReg extends UnionStruct {
  @bits(0) fc0: number;
  @bits(1) fc1: number;
}

/**
 * Input Status #0 Register (Read-only at 3C2h)
 *
 * @export
 * @class InputStatus0
 * @extends {UnionStruct}
 */
export class InputStatus0 extends UnionStruct {
  @bits(4) ss: number;
}

/**
 * Input Status #1 Register (Read at 3BAh (mono) or 3DAh (color))
 *
 * @export
 * @class InputStatus1
 * @extends {UnionStruct}
 */
export class InputStatus1 extends UnionStruct {
  @bits(0) dd: number;
  @bits(3) vretrace: number;
}

/**
 * Group of VGA External Registers (sometimes called the General Registers)
 *
 * @export
 * @class VGAExternalRegs
 */
export class VGAExternalRegs {
  next3c0IsIndex = false; /* check 0x3DA port behaviour */
  miscReg = new MiscReg;
  featureControlReg = new FeatureControlReg;
  inputStatus0 = new InputStatus0;
  inputStatus1 = new InputStatus1;
}
