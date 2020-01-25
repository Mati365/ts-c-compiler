import * as R from 'ramda';

import {X86AbstractCPU} from './types';
import {X86CPU} from './X86CPU';

/**
 * Basic CPU stack implementation
 *
 * @export
 * @class X86Stack
 */
export class X86Stack {
  private cpu: X86CPU;

  constructor(cpu: X86CPU) {
    this.cpu = cpu;

    /**
   * Default stack segment address, after push()
   * values will be added at the end of mem
   *
   * @param {Number}  segment Stack segment index
   */
    /** Set default stack environment */
    Object.assign(cpu.registers, {
      ss: 0x0,
      sp: 0x0,
    });

    /**
     * Segment register push mapper
     * see: http://csiflabs.cs.ucdavis.edu/~ssdavis/50/8086%20Opcodes.pdf
     */
    const stackSregMap = {
      0x0: 'es', 0x8: 'cs',
      0x10: 'ss', 0x18: 'ds',
    };

    R.forEachObjIndexed(
      (name, key) => {
        const index = +key;

        /** PUSH sr16 */ cpu.opcodes[0x6 + index] = () => this.push(cpu.registers[stackSregMap[index]]);
        /** POP sr16  */ cpu.opcodes[0x7 + index] = () => {
          cpu.registers[stackSregMap[index]] = this.pop();
        };
      },
      stackSregMap,
    );
  }

  /**
   * Decrement stack pointer and push value to stack
   *
   * @param {number} val Value to be stored on stack
   * @param {number} [bits=0x2] Intel 8086 supports only 16bit stack
   * @memberof X86CPU
   */
  push(val: number, bits: number = 0x2): void {
    const {memIO, lastStackAddr, registers} = this.cpu;

    registers.sp = X86AbstractCPU.toUnsignedNumber(registers.sp - bits, 0x2);
    memIO.write[bits](val, lastStackAddr);
  }

  /**
   * POP n-bytes from stack
   *
   * @param {number} [bits=0x2]
   * @param {boolean} [read=true] Read bytes or only pop
   * @returns {number}
   * @memberof X86CPU
   */
  pop(bits: number = 0x2, read: boolean = true): number {
    const {memIO, lastStackAddr, registers} = this.cpu;
    const val = read && memIO.read[bits](lastStackAddr);

    registers.sp = X86AbstractCPU.toUnsignedNumber(registers.sp + bits, 0x2);
    return val;
  }
}
