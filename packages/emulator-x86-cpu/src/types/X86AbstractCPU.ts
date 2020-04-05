import * as R from 'ramda';

import {UnmountCallback} from '@compiler/core/types';
import {mutableOmitChildKeys} from '@compiler/core/utils/mutableOmitChildKeys';

import {X86_BINARY_MASKS} from '../constants/x86';

import {Logger} from '../Logger';
import {X86InterruptsSet} from './X86Interrupt';
import {X86PortsSet} from './X86Port';
import {X86RAM} from './X86RAM';
import {X86AbstractDevice} from './X86AbstractDevice';
import {
  X86RegsStore,
  X86RegName,
  X86Prefix,
  X86SegmentPrefix,
  X86BitsMode,
} from './X86Regs';

/**
 * @see X86_PREFIX_LABEL_MAP
 *
 * @export
 * @class X86PrefixesStore
 */
export class X86PrefixesStore {
  instruction: X86Prefix;
  segment: X86Prefix;
  operandSize: X86Prefix;
  addressSize: X86Prefix;
}

export class SegmentedAddress {
  constructor(
    public offset: number,
    public segment: number,
  ) {}

  toString() {
    const {offset, segment} = this;

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
 *
 * @export
 * @class RMByte
 */
export class RMByte {
  constructor(
    public mod: number,
    public reg: number,
    public rm: number,
  ) {}

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
    const {rm, mod, reg} = this;

    return (rm & 0b111) | ((reg & 0b111) << 0x3) | ((mod & 0b11) << 0x6);
  }
}

/**
 * Scale index byte, used in addressing in 32mode
 *
 * @export
 * @class SibByte
 */
export class SibByte {
  constructor(
    public scale: number,
    public index: number,
    public base: number,
  ) {}

  get byte() {
    const {scale, index, base} = this;

    return (scale & 0b111) | ((index & 0b111) << 0x3) | ((base & 0b11) << 0x6);
  }
}

/**
 * Base for creation other X86 16Bit CPU emulators
 *
 * @export
 * @abstract
 * @class X86AbstractCPU
 */
export abstract class X86AbstractCPU {
  pause: boolean = false;
  clock: boolean = true;

  mem: Buffer;
  memIO: X86RAM<X86AbstractCPU>;

  registers = new X86RegsStore;
  prefixes = new X86PrefixesStore;

  logger = new Logger;

  devices: {[uuid: string]: X86AbstractDevice<X86AbstractCPU>} = {};
  interrupts: X86InterruptsSet = {};
  ports: X86PortsSet = {};

  /** logic methods */
  abstract fetchOpcode(size?: number, incrementIP?: boolean, ignorePrefix?: boolean): number;
  abstract boot(device: Buffer|string, id?: number): void;
  abstract exec(cycles: number): void;
  abstract halt(message?: string, dump?: boolean): void;

  isHalted(): boolean { return this.clock === false; }

  /** Last stack item address */
  get lastStackAddr() {
    return this.getMemAddress('ss', 'sp');
  }

  /** Get active segment register */
  get segmentReg(): X86RegName {
    const {segment} = this.prefixes;

    if (segment)
      return (<X86SegmentPrefix> segment)._sr;

    return 'ds';
  }

  /**
   * Prints all content of registers/flags into logger
   *
   * @memberof X86AbstractCPU
   */
  debugDumpRegisters(): void {
    const {logger, registers} = this;
    const {regs, flags} = registers.debugDump();

    logger.table(regs);
    logger.warn(flags);
  }

  /**
   * Attach device to CPU by uuid
   *
   * @template C
   * @param {{uuid: string, new() : X86AbstractDevice<X86AbstractCPU>}} Device
   * @param {C} config
   * @returns {X86AbstractCPU}
   * @memberof X86AbstractCPU
   */
  attach<C>(Device: {uuid: string, new() : X86AbstractDevice<X86AbstractCPU>}, config?: C): X86AbstractCPU {
    if (R.isNil(Device.uuid))
      throw new Error('Missing device uuid!');

    this.devices[Device.uuid] = new Device().attach(this, config);
    return this;
  }

  /**
   * Appends interrupt to fake interrupts set
   *
   * @param {X86InterruptsSet} interrupts
   * @returns {UnmountCallback}
   * @memberof X86AbstractCPU
   */
  mountInterrupts(interrupts: X86InterruptsSet): UnmountCallback {
    Object.assign(
      this.interrupts,
      interrupts,
    );

    return () => {
      mutableOmitChildKeys(this.interrupts, interrupts);
    };
  }

  /**
   * Appends ports to fake ports list
   *
   * @param {X86PortsSet} ports
   * @returns {UnmountCallback}
   * @memberof X86AbstractCPU
   */
  mountPorts(ports: X86PortsSet): UnmountCallback {
    Object.assign(
      this.ports,
      ports,
    );

    return () => {
      mutableOmitChildKeys(this.ports, ports);
    };
  }

  /**
   * Decodes MOD RM byte
   *
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm}
   *
   * @static
   * @param {number} byte
   * @returns {RMByte}
   * @memberof X86AbstractCPU
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
   *
   * @static
   * @param {Integer} byte  8bit SIB byte
   * @returns Extracted value
   */
  static decodeSibByte(byte: number): SibByte {
    return new SibByte(
      (byte & 0xC0) >> 0x6, // scale
      (byte & 0x38) >> 0x3, // index
      byte & 0x7, // base
    );
  }

  /**
   * Return segmentated address
   *
   * @static
   * @param {Number} num  32bit address
   * @returns Segmented address
   */
  static getSegmentedAddress(num: number): SegmentedAddress {
    return new SegmentedAddress(
      num & 0xFFFF,
      (num >> 0x10) & 0xFFFF,
    );
  }

  /**
   * Convert segment based address to flat
   *
   * @param {X86RegName}  sreg  Segment register
   * @param {X86RegName}  reg   Normal register or offset
   * @returns {number}
   */
  getMemAddress(sreg: X86RegName, reg: X86RegName|Number): number {
    return (
      (X86AbstractCPU.toUnsignedNumber(this.registers[<string> sreg], 0x2) << 4)
        + X86AbstractCPU.toUnsignedNumber((<string> reg).length ? this.registers[<string> reg] : reg, 0x2)
    );
  }

  /**
   * Convert segment based address to flat
   *
   * @static
   * @param {number}  seg     Segment index
   * @param {number}  offset  Memory offset
   * @returns {number} Physical mem address
   */
  static getMemAddress(seg: number, offset: number): number {
    return (seg << 4) + offset;
  }

  /**
   * Convert signed byte number to normal
   *
   * @static
   * @param {number}  num   Number
   * @param {number}  bits  0x1 if 8bits, 0x2 if 16 bits
   * @returns {number} Signed number
   */
  static getSignedNumber(num: number, bits: X86BitsMode = 0x1): number {
    const sign = (num >> (0x8 * bits - 0x1)) & 0x1;
    if (sign)
      num -= X86_BINARY_MASKS[bits];
    return num;
  }

  /**
   * Convert signed byte number to unsigned
   *
   * @static
   * @param {number}  num   Number
   * @param {number}  bits  0x1 if 8bits, 0x2 if 16 bits
   * @returns {number} Unsigned number
   */
  static toUnsignedNumber(num: number, bits: X86BitsMode = 0x1): number {
    const up = X86_BINARY_MASKS[bits];
    if (num > up)
      return num - up - 0x1;

    if (num < 0x0)
      return up + num + 0x1;

    return num;
  }

  /**
   * Get most significant bit
   *
   * @static
   * @param {any} num
   * @param {number} [bits=0x1]
   *
   * @memberOf CPU
   */
  static msbit(num: number, bits: X86BitsMode = 0x1): number {
    return (num >> (bits * 0x8 - 0x1)) & 0x1;
  }

  /**
   * Get bit next to most significant bit
   *
   * @static
   * @param {any} num
   * @param {number} [bits=0x1]
   *
   * @memberOf CPU
   */
  static smsbit(num: number, bits: X86BitsMode = 0x1): number {
    return (num >> ((bits * 0x8 - 0x1) - 1)) & 0x1;
  }
}
