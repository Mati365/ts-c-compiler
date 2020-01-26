import {X86RegsStore} from './X86Regs';

export type X86InterruptHandler = (regs?: X86RegsStore) => void;

export type X86InterruptsSet = {
  [address: number]: X86InterruptHandler
};
