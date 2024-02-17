import { X86BitsMode } from '@ts-cc/x86-assembler';

export interface X86Port {
  set?(bits?: number, mode?: X86BitsMode): void;
  get?(bits?: number): number;
}

export type X86PortsSet = {
  [key: number]: X86Port;
};
