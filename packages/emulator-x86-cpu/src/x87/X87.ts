import {X86Unit} from '../X86Unit';
import {X87RegsStore} from './X87Regs';
import {X86InstructionSet} from '../X86InstructionSet';
import {X86OpcodesList} from '../X86CPU';

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
   * Loads FPU
   *
   * @returns
   * @memberof X87
   */
  init() {
    this.registers = new X87RegsStore;
    this.opcodes = [];

    const {cpu, registers} = this;
    const {memIO} = cpu;
    const {ieee754: ieee754Mem} = memIO;

    Object.assign(this.opcodes, {
      0x9B: () => {
        const bits = cpu.fetchOpcode(0x2, false);
        switch (bits) {
          /* FINIT */ case 0xE3DB:
            registers.reset();
            cpu.incrementIP(0x2);
            break;

          default:
        }
      },

      0xD9: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FLD st(i), C0+i */
          if (byte >= 0xC0 && byte <= 0xC7) {
            registers.safePush(
              registers[byte - 0xC0],
            );

            return 1;
          }

          return 0;
        },

        /* FLD mdr(32) D9 /0 d0 d1  */ 0x0: (address) => { registers.safePush(ieee754Mem.read.single(address)); },
        /* FST mdr(32) D9 /2 d0 d1 */ 0x2: (address) => { ieee754Mem.write.single(registers.st0, address); },
        /* FSTP mdr(32) D9 /3 d0 d1 */ 0x3: (address) => { ieee754Mem.write.single(registers.safePop(), address); },
      }),

      0xDD: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: (byte) => {
          /* FST st(i) DD D0+i */
          if (byte >= 0xD0 && byte <= 0xD7) {
            registers.setNth(byte - 0xD0, registers.st0);
            return 1;
          }

          /* FSTP st(i) DD D8+i */
          if (byte >= 0xD8 && byte <= 0xDF) {
            registers.setNth(byte - 0xD8, registers.st0);
            registers.safePop();
            return 1;
          }

          return 0;
        },

        /* FLD mqr(64) DD /0 d0 d1 */ 0x0: (address) => { registers.safePush(ieee754Mem.read.double(address)); },
        /* FST mqr(64) DD /2 d0 d1 */ 0x2: (address) => { ieee754Mem.write.double(registers.st0, address); },
        /* FSTP mqr(64) DD /3 d0 d1 */ 0x3: (address) => { ieee754Mem.write.double(registers.safePop(), address); },
      }),

      0xDB: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        /* FLD mtr(80) DD /0 d0 d1 */ 0x5: (address) => { registers.safePush(ieee754Mem.read.extended(address)); },
        /* FSTP mqr(64) DD /3 d0 d1 */ 0x7: (address) => { ieee754Mem.write.extended(registers.safePop(), address); },
      }),
    });
  }
}
