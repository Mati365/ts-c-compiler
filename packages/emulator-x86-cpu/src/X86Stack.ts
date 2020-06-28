import * as R from 'ramda';

import {X86AbstractCPU} from './types';
import {X86CPU} from './X86CPU';
import {X86Unit} from './X86Unit';

/**
 * Basic CPU stack implementation
 *
 * @export
 * @class X86Stack
 * @extends {X86Unit}
 */
export class X86Stack extends X86Unit {
  /**
   * Initialize CPU unit
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86Stack
   */
  protected init(cpu: X86CPU) {
    const {registers, memIO} = cpu;

    /**
     * Default stack segment address, after push()
     * values will be added at the end of mem
     *
     * @param {Number}  segment Stack segment index
     */
    /** Set default stack environment */
    Object.assign(registers, {
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

        /** PUSH sr16 */ cpu.opcodes[0x6 + index] = () => this.push(registers[stackSregMap[index]]);
        /** POP sr16  */ cpu.opcodes[0x7 + index] = () => {
          registers[stackSregMap[index]] = this.pop();
        };

        /** POP r/m16/32 */ cpu.opcodes[0x8F] = () => {
          cpu.parseRmByte(
            (reg: string) => {
              cpu.registers[reg] = this.pop(0x2);
            },
            (address) => {
              memIO.write[0x2](this.pop(0x2), address);
            },
            0x2,
          );
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
   * @returns {X86Stack}
   * @memberof X86Stack
   */
  push(val: number, bits: number = 0x2): X86Stack {
    const {memIO, registers} = this.cpu;

    registers.sp = X86AbstractCPU.toUnsignedNumber(registers.sp - bits, 0x2);
    memIO.write[bits](val, this.cpu.lastStackAddr);

    return this;
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
