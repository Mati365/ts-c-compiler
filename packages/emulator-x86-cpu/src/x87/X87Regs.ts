import * as R from 'ramda';

import {X86CPU} from '../X86CPU';
import {
  RegistersDebugDump,
  X86RegsStore,
} from '../types';

export enum X87Tag {
  VALID = 0b00,
  ZERO = 0b01,
  SPECIAL = 0b10,
  EMPTY = 0b11,
}

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

export const X87_STACK_REGISTERS = <const> ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7'];

export const X87_STACK_REGS_COUNT = X87_STACK_REGISTERS.length;

export type X87StackRegName = typeof X87_STACK_REGISTERS[number];

/**
 * @see {@link https://xem.github.io/minix86/manual/intel-x86-and-64-manual-vol1/o_7281d5ea06a5b67a-194.html}
 *
 * @export
 * @class X87RegsStore
 */
export class X87RegsStore {
  stack: number[] = []; // see: it contains normal JS floats
  totalPushed = 0; // used in overflow checking

  flags: number = 0x0;
  control: number = 0x0;
  status: number = 0x0;
  tags: number = 0x0;
  fdp: number = 0x0; // todo: data pointer
  fip: number = 0x0; // todo: instruction pointer
  lastInstructionOpcode: number = 0x0;

  get wrappedSize() { return this.totalPushed % X87_STACK_REGS_COUNT; }
  get st0() { return this.stack[0]; } get st1() { return this.stack[1]; }
  get st2() { return this.stack[2]; } get st3() { return this.stack[3]; }
  get st4() { return this.stack[4]; } get st5() { return this.stack[5]; }
  get st6() { return this.stack[6]; } get st7() { return this.stack[7]; }

  /**
   * Prints all registers
   *
   * @returns {RegistersDebugDump}
   * @memberof X87RegsStore
   */
  debugDump(): RegistersDebugDump {
    const {stack, tags, fip} = this;
    const regs = {
      tags: X86CPU.toUnsignedNumber(tags, 0x2),
      fip,
    };

    const originTopOffset = X87_STACK_REGS_COUNT - this.wrappedSize;
    R.forEach(
      (index: number) => {
        let stIndex = index - originTopOffset;
        if (stIndex < 0)
          stIndex += X87_STACK_REGS_COUNT;

        regs[`fp${index} st${stIndex}(${X87Tag[this.getNthTag(stIndex)]})`] = (stack[stIndex] ?? 0x0).toString();
      },
      R.times(R.identity, 8),
    );

    return {
      regs: X86RegsStore.toRegistersTable(regs),
    };
  }

  /**
   * Resets FPU, look at finit
   *
   * @memberof X87RegsStore
   */
  reset() {
    Object.assign(
      this,
      {
        stack: [],
        tags: 0xFFFF,
        control: 0x037F,
        status: 0x0,
        fdp: 0x0,
        fip: 0x0,
        lastInstructionOpcode: 0x0,
      },
    );
  }

  /**
   * Get number tag

   * @static
   * @param {number} num
   * @returns {X87Tag}
   * @memberof X87RegsStore
   */
  static checkFloatingNumberTag(num: number): X87Tag {
    if (num === null || num === undefined)
      return X87Tag.EMPTY;

    if (num === 0)
      return X87Tag.ZERO;

    if (Number.isNaN(num) || !Number.isFinite(num))
      return X87Tag.SPECIAL;

    return X87Tag.VALID;
  }

  /**
   * Returns nth stack register tag
   *
   * @param {number} nth
   * @returns {X87Tag}
   * @memberof X87RegsStore
   */
  getNthTag(nth: number): X87Tag {
    return (this.tags >> (14 - 2 * nth)) & 0b11;
  }

  /**
   * Sets nth stack value
   *
   * @param {number} nth
   * @param {number} value
   * @memberof X87RegsStore
   */
  setNth(nth: number, value: number): void {
    const {stack} = this;

    stack[nth] = value;
  }

  /**
   * Throws exception if stack is empty
   *
   * @returns {number}
   * @memberof X87RegsStore
   */
  safePop(): number {
    const {stack} = this;

    if (this.totalPushed < X87_STACK_REGS_COUNT)
      this.tags = (this.tags << 0x2) & 0xFFFF;

    this.totalPushed = Math.max(0, this.totalPushed - 1); // todo: check
    return stack.shift();
  }

  /**
   * Limits pushed values count to max 8 otherwise throw exception
   *
   * @param {number} num
   * @memberof X87RegsStore
   */
  safePush(num: number): void {
    const {stack, tags} = this;
    const parsedNum = (
      this.totalPushed >= 8
        ? -Infinity
        : num
    );

    stack[this.wrappedSize] = parsedNum;

    // bochs ignores tags update if wraps around
    if (this.totalPushed < X87_STACK_REGS_COUNT)
      this.tags = ((tags >> 0x2) | (X87RegsStore.checkFloatingNumberTag(parsedNum) << 14)) & 0xFFFF;

    this.totalPushed++;
  }
}
