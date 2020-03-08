export type X86Flags = {
  busy: boolean,
  conditionCode: number,
  topStackPointer: number,
  errorSummary: boolean,
  stackFault: boolean,
  precision: boolean,
  underflow: boolean,
  overflow: boolean,
  zeroDivide: boolean,
  denormalizedOperand: boolean,
  invalidOperation: boolean,
};

/**
 * @see {@link https://xem.github.io/minix86/manual/intel-x86-and-64-manual-vol1/o_7281d5ea06a5b67a-194.html}
 *
 * @export
 * @class X87RegsStore
 */
export class X87RegsStore {
  status: number = 0;
  stack: number[] = new Array(7);

  get st0() { return this.stack[0]; }
  get st1() { return this.stack[1]; }
  get st2() { return this.stack[2]; }
  get st3() { return this.stack[3]; }
  get st4() { return this.stack[4]; }
  get st5() { return this.stack[5]; }
  get st6() { return this.stack[6]; }
  get st7() { return this.stack[7]; }
  get st8() { return this.stack[8]; }
}

export type X87RegName = 'status' | 'st0' | 'st1' | 'st2' | 'st3' | 'st4' | 'st5' | 'st6' | 'st7';
