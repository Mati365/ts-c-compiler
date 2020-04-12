/* eslint-disable max-len */
import {X86Unit} from '../X86Unit';
import {X87RegsStore} from './X87Regs';
import {X86InstructionSet} from '../X86InstructionSet';
import {X86OpcodesList} from '../X86CPU';
import {X86AbstractCPU} from '../types';
import {
  X87Error,
  X87ErrorCode,
} from './X87Error';

/**
 * Floating point intel 8087 fpu
 *
 * @export
 * @class X87
 * @extends {X86Unit}
 */
export class X87 extends X86Unit {
  private registers: X87RegsStore;
  private opcodes: X86OpcodesList;

  static isX87Opcode(opcode: number): boolean {
    return opcode === 0x9B || (opcode >= 0xD8 && opcode <= 0xDF);
  }

  /**
   * Prints to console all registers
   *
   * @memberof X87
   */
  debugDumpRegisters() {
    const {cpu, registers} = this;

    cpu.logger.table(
      registers.debugDump().regs,
    );
  }

  /**
   * Handles opcode
   *
   * @param {number} opcode   *
   * @memberof X87
   */
  tick(opcode: number) {
    const {opcodes, cpu, registers} = this;
    const operand = opcodes[opcode];

    if (operand) {
      registers.lastInstructionOpcode = opcode;

      registers.fcs = cpu.registers.cs;
      registers.fip = cpu.registers.ip - 0x1; // remove already fetched opcode

      operand();
    } else
      cpu.halt(`Unknown FPU opcode 0x${opcode.toString(16).toUpperCase()}`);
  }

  /**
   * Divides number by number, if b zero throws div exception
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   * @memberof X87
   */
  fdiv(a: number, b: number): number {
    if (!b && !this.registers.zeroDivExceptionMask)
      throw new X87Error(X87ErrorCode.DIVIDE_BY_ZERO);

    return a / b;
  }

  /**
   * Loads FPU
   *
   * @returns
   * @memberof X87
   */
  init() {
    this.registers = new X87RegsStore;
    this.opcodes = [];

    const {cpu, registers: regs} = this;
    const {memIO} = cpu;
    const {ieee754: ieee754Mem} = memIO;

    Object.assign(this.opcodes, {
      0x9B: () => {
        const bits = cpu.fetchOpcode(0x2, false);
        switch (bits) {
          /* FINIT */ case 0xE3DB:
            regs.reset();
            cpu.incrementIP(0x2);
            break;

          default:
        }
      },

      0xD8: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* D8 C8+i FMUL ST(0), ST(i) */
          if (byte >= 0xC8 && byte <= 0xCF) {
            regs.setNthValue(0x0, regs.st0 * regs.nth(byte - 0xC8));
            return 1;
          }

          /* D8 F0+i FDIV ST(0), ST(i) */
          if (byte >= 0xF0 && byte <= 0xF7) {
            regs.setNthValue(0x0, this.fdiv(regs.st0, regs.nth(byte - 0xF0)));
            return 1;
          }

          /* D8 F8+i FDIVR ST(0), ST(i) */
          if (byte >= 0xF8 && byte <= 0xFF) {
            regs.setNthValue(0x0, this.fdiv(regs.nth(byte - 0xF8), regs.st0));
            return 1;
          }

          return 0;
        },

        /* FMUL mdr(32) */ 0x1: (address) => { regs.setNthValue(0x0, regs.st0 * ieee754Mem.read.single(address)); },
        /* FDIV mdr(32) */ 0x6: (address) => { regs.setNthValue(0x0, this.fdiv(regs.st0, ieee754Mem.read.single(address))); },
        /* FDIVR mdr(32) */ 0x7: (address) => { regs.setNthValue(0x0, this.fdiv(ieee754Mem.read.single(address), regs.st0)); },
      }),

      0xD9: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FLD st(i), C0+i */
          if (byte >= 0xC0 && byte <= 0xC7) {
            regs.safePush(regs[byte - 0xC0]);
            return 1;
          }

          return 0;
        },

        /* FLD mdr(32) D9 /0 d0 d1  */ 0x0: (address) => { regs.safePush(ieee754Mem.read.single(address)); },
        /* FST mdr(32) D9 /2 d0 d1 */ 0x2: (address) => { ieee754Mem.write.single(regs.st0, address); },
        /* FSTP mdr(32) D9 /3 d0 d1 */ 0x3: (address) => { ieee754Mem.write.single(regs.safePop(), address); },
      }),

      0xDB: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        /* FLD mtr(80) DD /0 d0 d1 */ 0x5: (address) => { regs.safePush(ieee754Mem.read.extended(address)); },
        /* FSTP mtr(80) DB /7 d0 d1 */ 0x7: (address) => { ieee754Mem.write.extended(regs.safePop(), address); },
      }),

      0xDA: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        /* FIMUL mdr(32) DA /1 */ 0x1: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x4](address), 0x4);
          regs.setNthValue(0, intImm * regs.st0);
        },

        /* FIDIV mdr(32) DA /6 */ 0x6: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x4](address), 0x4);
          regs.setNthValue(0, this.fdiv(regs.st0, intImm));
        },

        /* FIDIVR mdr(32) DA /7 */ 0x7: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x4](address), 0x4);
          regs.setNthValue(0, this.fdiv(intImm, regs.st0));
        },
      }),

      0xDC: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FMUL ST(i), ST(0) DC C8+i */
          if (byte >= 0xC8 && byte <= 0xCF) {
            const registerIndex = byte - 0xC8;
            regs.setNthValue(registerIndex, regs.nth(registerIndex) * regs.st0);
            return 1;
          }

          /* FDIVR ST(i), ST(0) DC F0+i */
          if (byte >= 0xF0 && byte <= 0xF7) {
            const registerIndex = byte - 0xF0;
            regs.setNthValue(registerIndex, this.fdiv(regs.st0, regs.nth(registerIndex)));
            return 1;
          }

          /* FDIV ST(i), ST(0) DC F8+i */
          if (byte >= 0xF8 && byte <= 0xFF) {
            const registerIndex = byte - 0xF8;
            regs.setNthValue(registerIndex, this.fdiv(regs.nth(registerIndex), regs.st0));
            return 1;
          }

          return 0;
        },

        /* FMUL mqr(64) */ 0x1: (address) => { regs.setNthValue(0x0, regs.st0 * ieee754Mem.read.double(address)); },
        /* FDIV mqr(64) */ 0x6: (address) => { regs.setNthValue(0x0, this.fdiv(regs.st0, ieee754Mem.read.double(address))); },
        /* FDIVR mqr(64) */ 0x7: (address) => { regs.setNthValue(0x0, this.fdiv(ieee754Mem.read.double(address), regs.st0)); },
      }),

      0xDD: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FST st(i) DD D0+i */
          if (byte >= 0xD0 && byte <= 0xD7) {
            regs.setNthValue(byte - 0xD0, regs.st0);
            return 1;
          }

          /* FSTP st(i) DD D8+i */
          if (byte >= 0xD8 && byte <= 0xDF) {
            regs.setNthValue(byte - 0xD8, regs.st0);
            regs.safePop();
            return 1;
          }

          return 0;
        },

        /* FLD mqr(64) DD /0 d0 d1 */ 0x0: (address) => { regs.safePush(ieee754Mem.read.double(address)); },
        /* FST mqr(64) DD /2 d0 d1 */ 0x2: (address) => { ieee754Mem.write.double(regs.st0, address); },
        /* FSTP mqr(64) DD /3 d0 d1 */ 0x3: (address) => { ieee754Mem.write.double(regs.safePop(), address); },
      }),

      0xDE: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FMULP ST(i), ST(0) DE C8+i */
          if (byte >= 0xC8 && byte <= 0xCF) {
            const registerIndex = byte - 0xC8;

            regs.setNthValue(registerIndex, regs.nth(registerIndex) * regs.st0);
            regs.safePop();
            return 1;
          }

          /* FDIVRP ST(i), ST(0) DE F0+i */
          if (byte >= 0xF0 && byte <= 0xF7) {
            const registerIndex = byte - 0xF0;

            regs.setNthValue(registerIndex, this.fdiv(regs.st0, regs.nth(registerIndex)));
            regs.safePop();
            return 1;
          }

          /* FDIVP ST(i), ST(0) DE F8+i */
          if (byte >= 0xF8 && byte <= 0xFF) {
            const registerIndex = byte - 0xF8;

            regs.setNthValue(registerIndex, this.fdiv(regs.nth(registerIndex), regs.st0));
            regs.safePop();
            return 1;
          }

          return 0;
        },

        /* FIMUL mw(16) DE /1 */ 0x1: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x2](address), 0x2);
          regs.setNthValue(0, intImm * regs.st0);
        },

        /* FDIV mw(16) DE /6 */ 0x6: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x2](address), 0x2);
          regs.setNthValue(0, this.fdiv(regs.st0, intImm));
        },

        /* FDIVR mw(16) DE /7 */ 0x7: (address) => {
          const intImm = X86AbstractCPU.getSignedNumber(memIO.read[0x2](address), 0x2);
          regs.setNthValue(0, this.fdiv(intImm, regs.st0));
        },
      }),
    });
  }
}
