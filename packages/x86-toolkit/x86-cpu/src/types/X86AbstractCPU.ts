import * as R from 'ramda';

import { mutableOmitChildKeys } from '@compiler/core/utils/mutableOmitChildKeys';
import { getMSbit } from '@compiler/core/utils/bits';

import { UnmountCallback } from '@compiler/core/types';
import { BINARY_MASKS } from '@compiler/core/constants';

import { Logger } from '../Logger';
import { X86InterruptsSet, X86Interrupt } from './X86Interrupt';
import { X86PortsSet } from './X86Port';
import { X86RAM } from './X86RAM';
import { X86AbstractDevice } from './X86AbstractDevice';
import {
  X86RegsStore,
  X86RegName,
  X86Prefix,
  X86SegmentPrefix,
  X86BitsMode,
} from './X86Regs';

/**
 * @see X86_PREFIX_LABEL_MAP
 */
export class X86PrefixesStore {
  instruction: X86Prefix;
  segment: X86Prefix;
  operandSize: X86Prefix;
  addressSize: X86Prefix;
  empty: boolean = true;

  clear() {
    this.empty = true;
    this.instruction = null;
    this.segment = null;
    this.operandSize = null;
    this.addressSize = null;
  }
}

export class SegmentedAddress {
  constructor(public offset: number, public segment: number) {}

  toString() {
    const { offset, segment } = this;

    return `${offset.toString(16)}:${segment.toString(16)}`;
  }
}

export enum RMAddressingMode {
  INDIRECT_ADDRESSING = 0b00,
  ONE_BYTE_SIGNED_DISP = 0b01,
  FOUR_BYTE_SIGNED_DISP = 0b10,
  REG_ADDRESSING = 0b11,
}

/**
 * Addressing mode byte
 */
export class RMByte {
  constructor(public mod: number, public reg: number, public rm: number) {}

  getDisplacementByteSize(): number {
    switch (this.mod) {
      case RMAddressingMode.FOUR_BYTE_SIGNED_DISP:
        return 0x4;

      case RMAddressingMode.ONE_BYTE_SIGNED_DISP:
        return 0x1;

      default:
        return null;
    }
  }

  get byte() {
    const { rm, mod, reg } = this;

    return (rm & 0b111) | ((reg & 0b111) << 0x3) | ((mod & 0b11) << 0x6);
  }
}

/**
 * Scale index byte, used in addressing in 32mode
 */
export class SibByte {
  constructor(
    public scale: number,
    public index: number,
    public base: number,
  ) {}

  get byte() {
    const { scale, index, base } = this;

    return (scale & 0b111) | ((index & 0b111) << 0x3) | ((base & 0b11) << 0x6);
  }
}

/**
 * Base for creation other X86 16Bit CPU emulators
 */
export abstract class X86AbstractCPU {
  pause: boolean = false;
  clock: boolean = true;

  mem: Uint8Array;
  memIO: X86RAM<X86AbstractCPU>;

  registers = new X86RegsStore();
  prefixes = new X86PrefixesStore();

  logger = new Logger();

  devices: { [uuid: string]: X86AbstractDevice<X86AbstractCPU> } = {};
  interrupts: X86InterruptsSet = {};
  ports: X86PortsSet = {};

  /** logic methods */
  abstract fetchOpcode(
    size?: number,
    incrementIP?: boolean,
    ignorePrefix?: boolean,
  ): number;

  abstract boot(device: Buffer | string, id?: number): void;
  abstract exec(time: number): void;
  abstract halt(message?: string, dump?: boolean): void;
  abstract interrupt(interrupt: X86Interrupt): boolean;

  isHalted(): boolean {
    return this.clock === false;
  }

  /** Last stack item address */
  get lastStackAddr() {
    return this.getMemAddress('ss', 'sp');
  }

  /** Get active segment register */
  get segmentReg(): X86RegName {
    const { segment } = this.prefixes;

    if (segment) {
      return (<X86SegmentPrefix>segment)._sr;
    }

    return 'ds';
  }

  /**
   * Prints all content of registers/flags into logger
   */
  debugDumpRegisters(): void {
    const { logger, registers } = this;
    const { regs, flags } = registers.debugDump();

    logger.table(regs);
    logger.warn(flags);
  }

  /**
   * Attach device to CPU by uuid
   */
  attach<C>(
    Device: { uuid: string; new (): X86AbstractDevice<X86AbstractCPU> },
    config?: C,
  ): X86AbstractCPU {
    if (R.isNil(Device.uuid)) {
      throw new Error('Missing device uuid!');
    }

    this.devices[Device.uuid] = new Device().attach(this, config);
    return this;
  }

  /**
   * Appends interrupt to fake interrupts set
   */
  mountInterrupts(interrupts: X86InterruptsSet): UnmountCallback {
    Object.assign(this.interrupts, interrupts);

    return () => {
      mutableOmitChildKeys(this.interrupts, interrupts);
    };
  }

  /**
   * Appends ports to fake ports list
   */
  mountPorts(ports: X86PortsSet): UnmountCallback {
    Object.assign(this.ports, ports);

    return () => {
      mutableOmitChildKeys(this.ports, ports);
    };
  }

  /**
   * Releases memory allocated by all devices
   */
  release(): void {
    if (!this.isHalted()) {
      this.halt();
    }

    R.forEachObjIndexed(device => device.release(), this.devices);

    this.devices = null;
  }

  /**
   * Return value in microseconds
   */
  static microtick(): number {
    return performance.now();
  }

  /**
   * Decodes MOD RM byte
   *
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm}
   */
  static decodeRmByte(byte: number): RMByte {
    return new RMByte(
      byte >> 0x6, // byte
      (byte >> 0x3) & 0x7, // reg
      byte & 0x7, // rm
    );
  }

  /**
   * Decodes SIB byte
   *
   * @see {@link http://www.swansontec.com/sintel.html}
   */
  static decodeSibByte(byte: number): SibByte {
    return new SibByte(
      (byte & 0xc0) >> 0x6, // scale
      (byte & 0x38) >> 0x3, // index
      byte & 0x7, // base
    );
  }

  /**
   * Return segmentated address
   */
  static getSegmentedAddress(num: number): SegmentedAddress {
    return new SegmentedAddress(num & 0xffff, (num >> 0x10) & 0xffff);
  }

  /**
   * Convert segment based address to flat
   */
  getMemAddress(sreg: X86RegName, reg: X86RegName | Number): number {
    return (
      (X86AbstractCPU.toUnsignedNumber(this.registers[<string>sreg], 0x2) <<
        4) +
      X86AbstractCPU.toUnsignedNumber(
        (<string>reg).length ? this.registers[<string>reg] : reg,
        0x2,
      )
    );
  }

  /**
   * Convert segment based address to flat
   */
  static getMemAddress(seg: number, offset: number): number {
    return (seg << 4) + offset;
  }

  /**
   * Convert signed byte number to normal
   */
  static getSignedNumber(num: number, bits: X86BitsMode = 0x1): number {
    const sign = (num >> (0x8 * bits - 0x1)) & 0x1;
    if (sign) {
      num -= BINARY_MASKS[bits] + 0x1;
    }
    return num;
  }

  /**
   * Convert signed byte number to unsigned
   */
  static toUnsignedNumber(num: number, bits: X86BitsMode = 0x1): number {
    const up = BINARY_MASKS[bits];
    if (num > up) {
      return num - up - 0x1;
    }

    if (num < 0x0) {
      return up + num + 0x1;
    }

    return num;
  }

  /**
   * Repeats most significant bit
   */
  static signExtend(
    num: number,
    bits: X86BitsMode,
    targetBits: X86BitsMode,
  ): number {
    if (targetBits <= bits) {
      return num;
    }

    const msbit = getMSbit(num, bits);
    const mask = msbit ? 0xff : 0x0;
    let output = num & BINARY_MASKS[bits];

    for (let i = bits; i < targetBits; ++i) {
      output |= mask << (i * 8);
    }

    return output;
  }
}
