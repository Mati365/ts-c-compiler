import * as R from 'ramda';

import { getBit, setBit } from '@ts-c-compiler/core';
import {
  X87_STACK_REGS_COUNT,
  toUnsignedNumber,
} from '@ts-c-compiler/x86-assembler';

import { RegistersDebugDump, X86RegsStore } from '../parts';
import { X87Error, X87ErrorCode } from './X87Error';

export enum X87Tag {
  VALID = 0b00,
  ZERO = 0b01,
  SPECIAL = 0b10,
  EMPTY = 0b11,
}

export type X87Flags = {
  busy: boolean;
  conditionCode: number;
  topStackPointer: number;
  errorSummary: boolean;
  stackFault: boolean;
  precision: boolean;
  underflow: boolean;
  overflow: boolean;
  zeroDivide: boolean;
  denormalizedOperand: boolean;
  invalidOperation: boolean;
};

/**
 * @see {@link https://xem.github.io/minix86/manual/intel-x86-and-64-manual-vol1/o_7281d5ea06a5b67a-194.html}
 * @see {@link https://johnloomis.org/ece314/notes/fpu/fpu.pdf}
 * @see {@link https://www.felixcloutier.com/x86/index.html}
 */
export class X87RegsStore {
  static CONTROL_BITS = {
    C0: 0x100,
    C1: 0x200,
    C2: 0x400,
    C3: 0x4000,
  };

  stack: number[] = null;
  stackPointer: number = null;

  flags: number = null;
  control: number = null; // masks
  status: number = null;
  tags: number = null;
  fdp: number = null;
  fip: number = null;
  fcs: number = null;
  fds: number = null;
  lastInstructionOpcode: number = 0x0;

  get st0() {
    return this.nth(0);
  }

  get st1() {
    return this.nth(1);
  }

  get st2() {
    return this.nth(2);
  }

  get st3() {
    return this.nth(3);
  }

  get st4() {
    return this.nth(4);
  }

  get st5() {
    return this.nth(5);
  }

  get st6() {
    return this.nth(6);
  }

  get st7() {
    return this.nth(7);
  }

  get invalidOpExceptionMask(): boolean {
    return getBit(0, this.control) === 1;
  }

  get denormalizedExceptionMask(): boolean {
    return getBit(1, this.control) === 1;
  }

  get zeroDivExceptionMask(): boolean {
    return getBit(2, this.control) === 1;
  }

  get overflowExceptionMask(): boolean {
    return getBit(3, this.control) === 1;
  }

  get underflowExceptionMask(): boolean {
    return getBit(4, this.control) === 1;
  }

  get c0() {
    return this.getStatusBit(8);
  }

  get c1() {
    return this.getStatusBit(9);
  }

  get c2() {
    return this.getStatusBit(10);
  }

  get c3() {
    return this.getStatusBit(14);
  }

  set invalidOperation(val: boolean) {
    this.setStatusBit(0, val);
  }

  set denormalizedOperand(val: boolean) {
    this.setStatusBit(1, val);
  }

  set zeroDivide(val: boolean) {
    this.setStatusBit(2, val);
  }

  set overflow(val: boolean) {
    this.setStatusBit(3, val);
  }

  set underflow(val: boolean) {
    this.setStatusBit(4, val);
  }

  set precision(val: boolean) {
    this.setStatusBit(5, val);
  }

  set stackFault(val: boolean) {
    this.setStatusBit(6, val);
  }

  set errorSummary(val: boolean) {
    this.setStatusBit(7, val);
  }

  set c0(val: boolean) {
    this.setStatusBit(8, val);
  }

  set c1(val: boolean) {
    this.setStatusBit(9, val);
  }

  set c2(val: boolean) {
    this.setStatusBit(10, val);
  }

  set c3(val: boolean) {
    this.setStatusBit(14, val);
  }

  /**
   * Prints all registers
   */
  debugDump(): RegistersDebugDump {
    const { stack, tags, control, status, fip, fcs } = this;
    const regs = {
      tags: toUnsignedNumber(tags, 0x2),
      control,
      status,
      fip,
      fcs,
    };

    R.forEach((index: number) => {
      let stIndex = (index - this.stackPointer) % X87_STACK_REGS_COUNT;
      if (stIndex < 0) {
        stIndex += X87_STACK_REGS_COUNT;
      }

      const tag = this.getNthTag(index);
      const name = `fp${index} st${stIndex}(${X87Tag[tag]})`;
      const value = stack[index];
      let parsedValue: string = null;

      if (
        tag === X87Tag.VALID ||
        (tag === X87Tag.EMPTY && Number.isFinite(value))
      ) {
        parsedValue = value.toString();
      } else if (tag === X87Tag.EMPTY) {
        parsedValue = '0';
      } else {
        parsedValue = '-INF';
      }

      regs[`${name}${stIndex === 0 ? ' <--' : ''}`] = parsedValue;
    }, R.times(R.identity, 8));

    return {
      regs: X86RegsStore.toRegistersTable(regs),
    };
  }

  /**
   * Resets FPU, look at finit
   */
  reset() {
    Object.assign(this, {
      stack: R.repeat(-Infinity, X87_STACK_REGS_COUNT),
      stackPointer: 0,
      tags: 0xffff,
      control: 0x037f,
      status: 0x0,
      fdp: 0x0,
      fip: 0x0,
      fcs: 0x0,
      fds: 0x0,
      lastInstructionOpcode: 0x0,
    });
  }

  isStackInitialized(): boolean {
    return this.stack !== null;
  }

  /**
   * Get number tag
   */
  static checkFloatingNumberTag(num: number): X87Tag {
    if (num === null || num === undefined) {
      return X87Tag.EMPTY;
    }

    if (num === 0) {
      return X87Tag.ZERO;
    }

    if (Number.isNaN(num) || !Number.isFinite(num)) {
      return X87Tag.SPECIAL;
    }

    return X87Tag.VALID;
  }

  /**
   * Access nth from TOP of stack
   */
  nth(nth: number, withoutFlagCheck?: boolean): number {
    const reg = (this.stackPointer + nth) % X87_STACK_REGS_COUNT;

    if (!withoutFlagCheck && this.getNthTag(reg) === X87Tag.EMPTY) {
      this.stackFault = true;
    }

    return this.stack[(this.stackPointer + nth) % X87_STACK_REGS_COUNT];
  }

  /**
   * Sets nth origin value value
   *
   * @see
   *  NTH is related to stack origin, 0 is top, 1 is second etc
   *  its not directly mapped to stack array!
   */
  setNthValue(nth: number, value: number, withoutTagUpdate?: boolean): void {
    const { stack } = this;
    const registerIndex = (this.stackPointer + nth) % X87_STACK_REGS_COUNT;

    stack[registerIndex] = value;

    if (!withoutTagUpdate) {
      this.setNthTag(registerIndex, X87RegsStore.checkFloatingNumberTag(value));
    }
  }

  /**
   * Sets nth bit of status
   */
  setStatusBit(nth: number, bit: number | boolean): void {
    this.status = setBit(nth, bit, this.status);
  }

  /**
   * Sets status register and updates stackPointer
   */
  setStatus(status: number): void {
    this.status = status;
    this.stackPointer = (status >> 11) & 0b111;
  }
  /**
   * Reads nth bit from status
   */
  getStatusBit(nth: number): boolean {
    return getBit(nth, this.status) === 1;
  }

  /**
   * Returns nth stack register tag
   */
  getNthTag(nth: number): X87Tag {
    return (this.tags >> (nth * 2)) & 0b11;
  }

  /**
   * Sets nth tag register value flags
   */
  setNthTag(nth: number, tag: X87Tag) {
    const offset = nth * 2;

    this.tags =
      (this.tags & ((0b11 << offset) ^ 0xffff)) | ((tag << offset) & 0xffff);
  }

  /**
   * Sets value to stack pointer and modifies status
   */
  setStackPointer(num: number): void {
    const newValue = num & (X87_STACK_REGS_COUNT - 1);

    this.stackPointer = newValue;
    this.status =
      (this.status & ((0b111 << 11) ^ 0xffff)) | ((newValue << 11) & 0xffff);
  }

  /**
   * Throws exception if stack is empty
   */
  safePop(): number {
    const { stack } = this;
    const prevTag = this.getNthTag(this.stackPointer);

    this.setNthTag(this.stackPointer, X87Tag.EMPTY);
    this.setStackPointer(this.stackPointer + 1);

    if (prevTag === X87Tag.EMPTY) {
      this.c1 = false;
      this.stackFault = true;
      this.invalidOperation = true;

      if (!this.underflowExceptionMask) {
        throw new X87Error(X87ErrorCode.STACK_OVERFLOW_OR_UNDERFLOW);
      }
    }

    return stack[this.stackPointer];
  }

  /**
   * Limits pushed values count to max 8 otherwise throw exception
   */
  safePush(num: number): void {
    const { stack } = this;
    this.setStackPointer(this.stackPointer - 1);

    if (this.getNthTag(this.stackPointer) !== X87Tag.EMPTY) {
      this.c1 = true;
      this.stackFault = true;
      this.invalidOperation = true;

      this.setNthTag(this.stackPointer, X87Tag.VALID);
      stack[this.stackPointer] = -Infinity;

      if (!this.overflowExceptionMask) {
        throw new X87Error(X87ErrorCode.STACK_OVERFLOW_OR_UNDERFLOW);
      }
    } else {
      this.c1 = false;

      this.setNthTag(
        this.stackPointer,
        X87RegsStore.checkFloatingNumberTag(num),
      );
      stack[this.stackPointer] = num;
    }
  }
}
