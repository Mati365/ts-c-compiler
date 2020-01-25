import {UnmountCallback} from '../../shared/types';
import {X86InterruptsSet} from './X86Interrupt';
import {X86PortsSet} from './X86Port';
import {X86RegsStore} from './X86Regs';

export interface X86AbstractCPU {
  registers: X86RegsStore;

  /** logic methods */
  boot(device: File|string, id: number): void;
  exec(cycles: number): void;
  halt(message: string): void;

  /** device methods */
  mountInterrupts(interrupts: X86InterruptsSet): UnmountCallback;
  mountPorts(ports: X86PortsSet): UnmountCallback;
}
