import { X86CPU } from './X86CPU';

/**
 * CPU Part
 */
export abstract class X86Unit {
  protected cpu: X86CPU;

  constructor(cpu: X86CPU) {
    this.cpu = cpu;
    this.init(cpu);
  }

  getCPU(): X86CPU {
    return this.cpu;
  }

  /**
   * Inits whole unit
   *
   * @todo
   *  Add release method?
   */
  protected abstract init(cpu: X86CPU): void;
}
