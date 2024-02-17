import * as R from 'ramda';

import { X86RegName, toUnsignedNumber } from '@ts-cc/x86-assembler';
import { mutableOmitChildKeys } from '@ts-cc/core';
import { UnmountCallback } from '@ts-cc/core';

import { Logger } from '../Logger';
import { X86InterruptsSet, X86Interrupt } from './X86Interrupt';
import { X86PortsSet } from './X86Port';
import { X86RAM } from './X86RAM';
import { X86AbstractDevice } from './X86AbstractDevice';
import { X86RegsStore, X86Prefix, X86SegmentPrefix } from './X86Regs';

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
   * Convert segment based address to flat
   */
  getMemAddress(sreg: X86RegName, reg: X86RegName | Number): number {
    return (
      (toUnsignedNumber(this.registers[<string>sreg], 0x2) << 4) +
      toUnsignedNumber((<string>reg).length ? this.registers[<string>reg] : reg, 0x2)
    );
  }

  /**
   * Convert segment based address to flat
   */
  static getMemAddress(seg: number, offset: number): number {
    return (seg << 4) + offset;
  }
}
