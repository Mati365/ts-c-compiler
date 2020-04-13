import * as R from 'ramda';

import {getBit} from '@compiler/core/utils/bits';

import {X86CPU} from '../X86CPU';
import {
  RegistersDebugDump,
  X86RegsStore,
} from '../types';

import {
  X87Error,
  X87ErrorCode,
} from './X87Error';

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
 * @see {@link https://johnloomis.org/ece314/notes/fpu/fpu.pdf}
 * @see {@link https://www.felixcloutier.com/x86/index.html}
 *
 * @export
 * @class X87RegsStore
 */
export class X87RegsStore {
  stack: number[] = null;
  stackPointer: number = null;

  flags: number = null;
  control: number = null;
  status: number = null;
  tags: number = null;
  fdp: number = null;
  fip: number = null;
  fcs: number = null;
  lastInstructionOpcode: number = 0x0;

  get st0() { return this.nth(0); } get st1() { return this.nth(1); }
  get st2() { return this.nth(2); } get st3() { return this.nth(3); }
  get st4() { return this.nth(4); } get st5() { return this.nth(5); }
  get st6() { return this.nth(6); } get st7() { return this.nth(7); }

  get zeroDivExceptionMask(): boolean { return getBit(2, this.control) === 1; }
  get overflowExceptionMask(): boolean { return getBit(3, this.control) === 1; }
  get underflowExceptionMask(): boolean { return getBit(4, this.control) === 1; }

  /**
   * Prints all registers
   *
   * @returns {RegistersDebugDump}
   * @memberof X87RegsStore
   */
  debugDump(): RegistersDebugDump {
    const {stack, tags, fip, fcs} = this;
    const regs = {
      tags: X86CPU.toUnsignedNumber(tags, 0x2),
      fip,
      fcs,
    };

    R.forEach(
      (index: number) => {
        let stIndex = (index - this.stackPointer) % X87_STACK_REGS_COUNT;
        if (stIndex < 0)
          stIndex += X87_STACK_REGS_COUNT;

        const tag = this.getNthTag(index);
        const name = `fp${index} st${stIndex}(${X87Tag[tag]})`;
        const value = stack[index];
        let parsedValue: string = null;

        if (tag === X87Tag.VALID || (tag === X87Tag.EMPTY && Number.isFinite(value)))
          parsedValue = value.toString();
        else if (tag === X87Tag.EMPTY)
          parsedValue = '0';
        else
          parsedValue = '-INF';

        regs[`${name}${stIndex === 0 ? ' <--' : ''}`] = parsedValue;
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
        stack: R.repeat(-Infinity, X87_STACK_REGS_COUNT),
        stackPointer: X87_STACK_REGS_COUNT,
        tags: 0xFFFF,
        control: 0x037F,
        status: 0x0,
        fdp: 0x0,
        fip: 0x0,
        fcs: 0x0,
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
   * Access nth from TOP of stack
   *
   * @param {number} nth
   * @returns {number}
   * @memberof X87RegsStore
   */
  nth(nth: number): number {
    return this.stack[
      (this.stackPointer + nth) % X87_STACK_REGS_COUNT
    ];
  }

  /**
   * Sets nth origin value value
   *
   * @see
   *  NTH is related to stack origin, 0 is top, 1 is second etc
   *  its not directly mapped to stack array!
   *
   * @param {number} nth
   * @param {number} value
   * @memberof X87RegsStore
   */
  setNthValue(nth: number, value: number): void {
    const {stack} = this;
    const registerIndex = (this.stackPointer + nth) % X87_STACK_REGS_COUNT;

    stack[registerIndex] = value;
    this.setNthTag(registerIndex, X87RegsStore.checkFloatingNumberTag(value));
  }

  /**
   * Returns nth stack register tag
   *
   * @param {number} nth
   * @returns {X87Tag}
   * @memberof X87RegsStore
   */
  getNthTag(nth: number): X87Tag {
    return (this.tags >> (nth * 2)) & 0b11;
  }

  /**
   * Sets nth tag register value flags
   *
   * @param {number} nth
   * @param {X87Tag} tag
   * @memberof X87RegsStore
   */
  setNthTag(nth: number, tag: X87Tag) {
    const offset = nth * 2;

    this.tags = (this.tags & ((0b11 << offset) ^ 0xFFFF)) | ((tag << offset) & 0xFFFF);
  }

  /**
   * Throws exception if stack is empty
   *
   * @returns {number}
   * @memberof X87RegsStore
   */
  safePop(): number {
    const {stack} = this;

    if (this.getNthTag(this.stackPointer) === X87Tag.EMPTY && !this.underflowExceptionMask)
      throw new X87Error(X87ErrorCode.NUMERIC_UNDERFLOW);

    this.setNthTag(this.stackPointer, X87Tag.EMPTY);
    this.stackPointer = (this.stackPointer + 1) & (X87_STACK_REGS_COUNT - 1);

    return stack[this.stackPointer];
  }

  /**
   * Limits pushed values count to max 8 otherwise throw exception
   *
   * @param {number} num
   * @memberof X87RegsStore
   */
  safePush(num: number): void {
    const {stack} = this;
    this.stackPointer = (this.stackPointer - 1) & (X87_STACK_REGS_COUNT - 1);

    if (this.getNthTag(this.stackPointer) !== X87Tag.EMPTY) {
      if (!this.overflowExceptionMask)
        throw new X87Error(X87ErrorCode.NUMERIC_OVERFLOW);

      num = -Infinity;
      this.setNthTag(this.stackPointer, X87Tag.VALID);
    } else
      this.setNthTag(this.stackPointer, X87RegsStore.checkFloatingNumberTag(num));

    stack[this.stackPointer] = num;
  }
}
