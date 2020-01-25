import * as R from 'ramda';

import {UnmountCallback} from '../../shared/types';
import {Logger} from '../Logger';

import {X86InterruptsSet} from './X86Interrupt';
import {X86PortsSet} from './X86Port';
import {X86RegsStore} from './X86Regs';
import {X86AbstractDevice} from './X86AbstractDevice';
import {X86RAM} from './X86RAM';

/**
 * Remvoe child keys from parent keeping parent reference
 *
 * @param {object} parent
 * @param {object} child
 * @returns {object}
 */
function mutableOmitChildKeys(parent: object, child: object): object {
  R.forEach(
    (key) => {
      delete parent[key];
    },
    R.keys(child),
  );

  return parent;
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

  mem: Buffer;
  memIO: X86RAM<X86AbstractCPU>;

  registers = new X86RegsStore;
  devices: {[uuid: string]: X86AbstractDevice<X86AbstractCPU>} = {};

  logger = new Logger;

  interrupts: X86InterruptsSet = {};
  ports: X86PortsSet = {};

  /** logic methods */
  abstract boot(device: File|string, id: number): void;
  abstract exec(cycles: number): void;
  abstract halt(message: string): void;

  /**
   * Attach device to CPU by uuid
   *
   * @template C
   * @param {{uuid: string, new() : X86AbstractDevice<X86AbstractCPU>}} Device
   * @param {C} config
   * @returns {X86AbstractCPU}
   * @memberof X86AbstractCPU
   */
  attach<C>(Device: {uuid: string, new() : X86AbstractDevice<X86AbstractCPU>}, config: C): X86AbstractCPU {
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
}
