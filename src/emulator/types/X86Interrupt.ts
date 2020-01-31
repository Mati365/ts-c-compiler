import {X86RegsStore} from './X86Regs';

export type X86InterruptHandlerCallback = (regs?: X86RegsStore) => void;

export type X86InterruptHandler = {
  physicalAddress: number,
  fn: X86InterruptHandlerCallback,
};

export type X86InterruptsSet = {
  [address: number]: X86InterruptHandler
};
