import * as R from 'ramda';

import { UnmountCallback } from '@ts-c/core';
import { MemoryRegionRange, X86RegName } from '@ts-c/x86-assembler';

import { X86_MAPPED_VM_MEM } from '../constants/x86';

import { X86InterruptsSet, X86InterruptHandlerCallback } from './X86Interrupt';
import { X86PortsSet, X86Port } from './X86Port';
import { X86AbstractCPU } from './X86AbstractCPU';

/**
 * Device that is attached to CPU, it:
 * - can work on mem range
 * - mount ports
 * - mount interrupts
 */
export abstract class X86AbstractDevice<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
> {
  protected cpu: TCPU = null;
  protected memRegion: MemoryRegionRange = null;
  protected interrupts: X86InterruptsSet = {};
  protected ports: X86PortsSet = {};
  protected irq: number = null;

  /** destructors */
  protected _portsUnmounter: UnmountCallback = null;
  protected _interruptsUnmounter: UnmountCallback = null;

  /**
   * Creates an instance of AbstractDevice.
   */
  constructor(memRegion?: MemoryRegionRange) {
    this.memRegion = memRegion;
  }

  abstract init(initConfig?: TInitConfig): void;

  raiseIRQ() {}

  /** Return CPU registers */
  get regs() {
    return this.cpu.registers;
  }

  /**
   * Allow to connect multiple ports to the same handler
   */
  protected mountPortsHandler(
    ports: number | number[],
    handler: X86Port,
  ): void {
    if (ports instanceof Array) {
      R.forEach(port => {
        this.ports[port] = handler;
      }, ports);
    } else {
      this.ports[ports] = handler;
    }
  }

  /**
   * Attaches and initializes device in provided cpu
   */
  attach(
    cpu: TCPU,
    initConfig?: TInitConfig,
  ): X86AbstractDevice<TCPU, TInitConfig> {
    this.release();

    this.cpu = cpu;
    this.init.call(this, initConfig);

    this._interruptsUnmounter = cpu.mountInterrupts(this.interrupts);
    this._portsUnmounter = cpu.mountPorts(this.ports);

    return this;
  }

  /**
   * Assings interrupts to device, it should occur in init phrase
   */
  attachInterrupts(
    interruptCode: string | number,
    reg: X86RegName,
    list: { [address: number]: X86InterruptHandlerCallback },
    physicalAddress: number = ((this.memRegion && this.memRegion.low) ||
      X86_MAPPED_VM_MEM.low) + +interruptCode,
  ) {
    this.interrupts[interruptCode] = {
      physicalAddress,
      fn: () => {
        const func = this.regs[reg] as number;
        const callback = list[func];

        if (callback) {
          callback(this.regs);
        } else {
          this.cpu.halt(
            `Unknown interrupt 0x${interruptCode.toString(
              16,
            )} function 0x${func.toString(16)}!`,
          );
        }
      },
    };
  }

  /**
   * Called when CPU is booting
   */
  boot(): void {}

  /**
   * Called when CPU is halting
   */
  halt(): void {}

  /**
   * Removes listeners from CPU
   */
  release() {
    /* eslint-disable no-unused-expressions */
    this._interruptsUnmounter?.();
    this._portsUnmounter?.();
    /* eslint-enable no-unused-expressions */

    this._interruptsUnmounter = null;
    this._portsUnmounter = null;
  }
}

export abstract class X86UuidAbstractDevice<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
> extends X86AbstractDevice<TCPU, TInitConfig> {
  static readonly uuid: string;
}
