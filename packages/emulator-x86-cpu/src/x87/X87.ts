import {X86Unit} from '../X86Unit';
import {X87RegsStore} from './X87Regs';

export class X87 extends X86Unit {
  private regs = new X87RegsStore;

  init() {
    console.info('x87');
  }
}
