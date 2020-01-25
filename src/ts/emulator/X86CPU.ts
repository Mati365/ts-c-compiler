import {X86AbstractCPU} from './types';

/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
export class X86CPU extends X86AbstractCPU {
  /** logic methods */
  boot(device: File|string, id: number): void {}

  exec(cycles: number): void {}

  halt(message: string): void {}
}
