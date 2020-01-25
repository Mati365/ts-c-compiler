import {
  MemRange,
  UnmountCallback,
} from '../../shared/types';

import {X86InterruptsSet} from './X86Interrupt';
import {X86PortsSet} from './X86Port';
import {X86RegName} from './X86Regs';
import {X86AbstractCPU} from './X86AbstractCPU';

/**
 * Device that is attached to CPU, it:
 * - can work on mem range
 * - mount ports
 * - mount interrupts
 *
 * @export
 * @abstract
 * @class AbstractDevice
 * @template TCPU
 * @template TInitConfig
 */
export abstract class X86AbstractDevice<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
> {
  protected cpu: TCPU = null;
  protected mem: MemRange = null;
  protected interrupts: X86InterruptsSet = {};
  protected ports: X86PortsSet = {};

  /** destructors */
  protected _portsUnmounter: UnmountCallback = null;
  protected _interruptsUnmounter: UnmountCallback = null;

  /**
   * Creates an instance of AbstractDevice.
   *
   * @param {MemRange} [mem]
   * @memberof AbstractDevice
   */
  constructor(mem?: MemRange) {
    this.mem = mem;
  }

  abstract init(initConfig?: TInitConfig): void;

  /** Return CPU registers */
  get regs() {
    return this.cpu.registers;
  }

  /**
   * Attaches and initializes device in provided cpu
   *
   * @param {TCPU} cpu
   * @param {TInitConfig} initConfig
   * @memberof AbstractDevice
   */
  attach(cpu: TCPU, initConfig: TInitConfig): X86AbstractDevice<TCPU, TInitConfig> {
    this.release();

    this.cpu = cpu;
    this.init.call(this, initConfig);

    this._interruptsUnmounter = cpu.mountInterrupts(this.interrupts);
    this._portsUnmounter = cpu.mountPorts(this.ports);

    return this;
  }

  /**
   * Assings interrupts to device, it should occur in init phrase
   *
   * @param {(string|number)} interruptCode
   * @param {X86RegName} reg
   * @param {X86InterruptsSet} list
   * @memberof AbstractDevice
   */
  attachInterrupts(interruptCode: string|number, reg: X86RegName, list: X86InterruptsSet) {
    this.interrupts[interruptCode] = () => {
      const func = <number> this.regs[reg];
      const callback = list[func];

      if (callback)
        callback(this.regs);
      else
        this.cpu.halt(`Unknown interrupt 0x${interruptCode.toString(16)} function 0x${func.toString(16)}!`);
    };
  }

  /**
   * Removes listeners from CPU
   *
   * @memberof AbstractDevice
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

/**
 * Creates device with uuid which is used in CPU to communication between devices
 *
 * @export
 * @template TCPU
 * @template TInitConfig
 * @param {string} uuid
 * @returns
 */
export function uuidX86Device<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
>(uuid: string) {
  abstract class X86UuidAbstractDevice extends X86AbstractDevice<TCPU, TInitConfig> {
    static uuid: string = uuid;
  }

  return X86UuidAbstractDevice;
}
