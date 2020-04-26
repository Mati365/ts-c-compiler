import * as R from 'ramda';

import {X86_REGISTERS} from './constants/x86';

import {X86Unit} from './X86Unit';
import {X86CPU, X86RegRMCallback, X86MemRMCallback} from './X86CPU';
import {
  X86BitsMode,
  X86Flags,
  RMByte,
  X86AbstractCPU,
  X86Interrupt,
  X86InterruptType,
} from './types';

type X86FlagCondition = (flags: X86Flags) => boolean|number;

type SwitchOpcodeOperator = (num: number, mode: X86BitsMode, byte: RMByte, register: boolean) => any;
type SwitchOpcodeOperators = {[offset: number]: SwitchOpcodeOperator} & {
  default?: SwitchOpcodeOperator,
  nonRMMatch?(byte: number): number,
};

/**
 * Basic CPU instruction set without ALU/IO instructions
 *
 * @export
 * @class X86InstructionSet
 * @extends {X86Unit}
 */
export class X86InstructionSet extends X86Unit {
  /* eslint-disable class-methods-use-this */
  /**
   * Initialize CPU IO ports handlers opcodes
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86IO
   */
  protected init(cpu: X86CPU): void {
    X86InstructionSet.initBaseOpcodes(cpu);
    X86InstructionSet.initBranchOpcodes(cpu);
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Switches instruction by RM reg byte
   *
   * @see
   *   If provided mode is null it will:
   *   - provide address in memCallback
   *   - provide register as null in regCallback
   *
   * @static
   * @param {X86CPU} cpu
   * @param {X86BitsMode} defaultMode
   * @param {SwitchOpcodeOperators} operators
   * @returns
   * @memberof X86InstructionSet
   */
  static switchRMOpcodeInstruction(cpu: X86CPU, defaultMode: X86BitsMode, operators: SwitchOpcodeOperators) {
    const {memIO, registers} = cpu;

    const operatorExecutor: SwitchOpcodeOperator = (val, mode, byte, register) => {
      const operator = operators[byte.reg] || operators.default;
      if (operator)
        return operator(val, mode, byte, register);

      throw new Error(`Unsupported operator! ${byte.reg}`);
    };

    const regCallback: X86RegRMCallback = (reg: string, _, byte, mode) => {
      const result = operatorExecutor(
        reg === null
          ? null
          : registers[reg],
        mode,
        byte,
        true,
      );

      if (result !== undefined)
        registers[reg] = result;
    };

    const memCallback: X86MemRMCallback = (address, _, byte, mode) => {
      // read only address
      if (mode === null) {
        operatorExecutor(address, null, byte, false);
        return;
      }

      const result = operatorExecutor(
        memIO.read[mode](address),
        mode,
        byte,
        false,
      );

      if (result !== undefined)
        memIO.write[mode](result, address);
    };

    const {nonRMMatch} = operators;
    return (mode?: X86BitsMode) => {
      if (nonRMMatch) {
        const byte = cpu.fetchOpcode(0x1, false, true);
        const matchBytes = nonRMMatch(byte);

        if (matchBytes !== 0) {
          cpu.incrementIP(matchBytes);
          return true;
        }
      }

      return cpu.parseRmByte(
        regCallback,
        memCallback,
        mode || defaultMode,
      );
    };
  }

  /**
   * Adds non-branch base cpu instructions
   *
   * @static
   * @param {X86CPU} cpu
   * @memberof X86InstructionSet
   */
  static initBaseOpcodes(cpu: X86CPU): void {
    const {alu, stack, memIO, registers, opcodes} = cpu;

    Object.assign(opcodes, {
      /** MOV r/m8, reg8 */ 0x88: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg: string, modeReg) => {
            registers[reg] = registers[X86_REGISTERS[bits][modeReg]];
          },
          (address, src: string) => {
            memIO.write[bits](registers[src], address);
          },
          bits,
        );
      },
      /** MOV r/m16, sreg */ 0x8C: () => {
        cpu.parseRmByte(
          (reg: string, modeReg) => {
            registers[reg] = registers[X86_REGISTERS.sreg[modeReg]];
          },
          (address, _, byte) => {
            memIO.write[0x2](registers[<string> X86_REGISTERS.sreg[byte.reg]], address);
          },
          0x2,
        );
      },
      /** MOV sreg, r/m16 */ 0x8E: () => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            registers[<string> X86_REGISTERS.sreg[modeReg]] = registers[reg];
          },
          (address, _, byte) => {
            registers[<string> X86_REGISTERS.sreg[byte.reg]] = memIO.read[0x2](address);
          },
          0x2,
        );
      },
      /** MOV r8, r/m8    */ 0x8A: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            registers[<string> X86_REGISTERS[bits][modeReg]] = registers[reg];
          },
          (address, reg: string) => {
            registers[reg] = memIO.read[bits](address);
          },
          bits,
        );
      },

      /** MOV al, m16  */ 0xA0: (bits = 0x1) => {
        registers[X86_REGISTERS[bits][0]] = memIO.read[bits](
          cpu.getMemAddress(cpu.segmentReg, cpu.fetchOpcode(0x2)),
        );
      },
      /** MOV ax, m16 */ 0xA1: () => cpu.opcodes[0xA0](0x2),

      /** MOV m8, al  */ 0xA2: (bits = 0x1) => {
        memIO.write[bits](
          registers[X86_REGISTERS[bits][0x0]],
          cpu.getMemAddress(cpu.segmentReg, cpu.fetchOpcode(0x2)),
        );
      },
      /** MOV m16, ax */ 0xA3: () => opcodes[0xA2](0x2),

      /** MOV r/m8, imm8  */ 0xC6: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          () => { /** todo */ throw new Error('0xC6: Fix me!'); },
          (address) => {
            memIO.write[bits](cpu.fetchOpcode(bits), address);
          },
          bits,
        );
      },
      /** MOV r/m16, reg16  */ 0x89: () => opcodes[0x88](0x2),
      /** MOV r16, r/m16    */ 0x8B: () => opcodes[0x8A](0x2),
      /** MOV r/m16, imm16  */ 0xC7: () => opcodes[0xC6](0x2),

      /** PUSH/INC/DEC reg8 */ 0xFE: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (_, modeReg, mode) => {
            const reg: string = X86_REGISTERS[bits][mode.rm];
            if (mode.reg === 0x6)
              stack.push(cpu.registers[reg]);
            else {
              registers[reg] = alu.exec(
                alu.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
                registers[reg],
                null, bits,
              );
            }
          },
          (address, reg, mode) => {
            const memVal = memIO.read[bits](address);
            if (mode.reg === 0x6)
              stack.push(memVal);
            else {
              memIO.write[bits](
                alu.exec(
                  alu.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
                  memVal, null,
                  bits,
                ),
                address,
              );
            }
          },
          bits,
        );
      },
      /** INC/DEC reg16 */ 0xFF: () => opcodes[0xFE](0x2),

      /** PUSHA */ 0x60: () => {
        const temp = registers.sp;
        for (let i = 0; i <= 0x7; ++i) {
          stack.push(
            i === 0x4
              ? temp
              : registers[<string> X86_REGISTERS[0x2][i]],
          );
        }
      },
      /** POPA  */ 0x61: () => {
        /** Skip SP */
        for (let i = 0x7; i >= 0; --i) {
          const val = stack.pop();
          if (i !== 0x4)
            registers[<string> X86_REGISTERS[0x2][i]] = val;
        }
      },

      /** PUSH imm8     */ 0x6A: () => stack.push(cpu.fetchOpcode(), 0x2),
      /** PUSH imm16    */ 0x68: () => stack.push(cpu.fetchOpcode(0x2), 0x2),

      /** PUSHF         */ 0x9C: () => stack.push(registers.flags),
      /** POPF          */ 0x9D: () => {
        registers.flags = stack.pop();
      },

      /** LOOPNE        */ 0xE0: () => {
        const relativeAddress = cpu.fetchOpcode();
        if (--registers.cx && !registers.status.zf)
          cpu.relativeJump(0x1, relativeAddress);
      },
      /** LOOP 8bit rel */ 0xE2: () => {
        const relativeAddress = cpu.fetchOpcode();
        if (--registers.cx)
          cpu.relativeJump(0x1, relativeAddress);
      },

      /** IRET 48b  */ 0xCF: () => {
        Object.assign(
          registers,
          {
            ip: stack.pop(),
            cs: stack.pop(),
            flags: stack.pop(),
          },
        );
      },

      /** RET far   */ 0xCB: () => {
        registers.ip = stack.pop();
        registers.cs = stack.pop();
      },
      /** RET near  */ 0xC3: (bits: X86BitsMode = 0x2) => {
        registers.ip = stack.pop(bits);
      },
      /** RET 16b   */ 0xC2: (bits: X86BitsMode = 0x2) => {
        const items = cpu.fetchOpcode(bits, false);
        registers.ip = stack.pop();

        stack.pop(items, false);
      },

      /** CALL 16bit/32bit dis  */ 0xE8: () => {
        stack.push(
          X86AbstractCPU.toUnsignedNumber(registers.ip + 0x2, 0x2),
        );

        cpu.relativeJump(0x2);
      },

      /** JMP rel 8bit  */ 0xEB: () => cpu.relativeJump(0x1),
      /** JMP rel 16bit */ 0xE9: () => cpu.relativeJump(0x2),
      /** FAR JMP 32bit */ 0xEA: () => {
        cpu.absoluteJump(
          cpu.fetchOpcode(0x2),
          cpu.fetchOpcode(0x2),
        );
      },

      /** STOSB */ 0xAA: (bits: X86BitsMode = 0x1) => {
        memIO.write[bits](
          registers[<string> X86_REGISTERS[bits][0]],
          cpu.getMemAddress('es', 'di'),
        );
        cpu.dfIncrement(bits, 'di');
      },
      /** STOSW */ 0xAB: () => opcodes[0xAA](0x2),

      /** CLI   */ 0xFA: () => { registers.status.if = 0x0; },
      /** STI   */ 0xFB: () => { registers.status.if = 0x1; },

      /** CLC   */ 0xF8: () => { registers.status.cf = 0x0; },
      /** STC   */ 0xF9: () => { registers.status.cf = 0x1; },

      /** CLD   */ 0xFC: () => { registers.status.df = 0x0; },
      /** STD   */ 0xFD: () => { registers.status.df = 0x1; },

      /** MOVSB */ 0xA4: (bits: X86BitsMode = 0x1) => {
        memIO.write[bits](
          memIO.read[bits](cpu.getMemAddress('ds', 'si')),
          cpu.getMemAddress('es', 'di'),
        );

        /** Increment indexes */
        cpu.dfIncrement(bits, 'si', 'di');
      },
      /** MOVSW */ 0xA5: () => opcodes[0xA4](0x2),

      /** LODSB */ 0xAC: (bits: X86BitsMode = 0x1) => {
        registers[<string> X86_REGISTERS[bits][0x0]] = memIO.read[bits](cpu.getMemAddress('ds', 'si'));
        cpu.dfIncrement(bits, 'si');
      },
      /** LODSW */ 0xAD: () => opcodes[0xAC](0x2),

      /** LDS r16, m16:16 */ 0xC5: (segment = 'ds') => {
        const {reg} = X86AbstractCPU.decodeRmByte(cpu.fetchOpcode());
        const addr = X86AbstractCPU.getSegmentedAddress(cpu.fetchOpcode(0x2, false));

        registers[<string> X86_REGISTERS[0x2][reg]] = addr.offset;
        registers[segment] = addr.segment;
      },
      /** LES r16, m16:16 */ 0xC4: () => opcodes[0xC5]('es'),
      /** LEA r16, mem    */ 0x8D: () => {
        cpu.parseRmByte(
          null,
          (address, reg: string) => {
            registers[reg] = address;
          },
          0x2,
          null,
        );
      },

      /** INT3 debug trap */ 0xCC: () => {
        cpu.interrupt(
          X86Interrupt.raise.debug(X86InterruptType.TRAP),
        );
      },

      /** INT imm8    */ 0xCD: () => {
        const code = cpu.fetchOpcode();

        cpu.interrupt(
          X86Interrupt.raise.software(code),
        );
      },

      /** RCL r/m8,  cl */ 0xD2: (bits: X86BitsMode = 0x1, dir = 0x1) => {
        cpu.parseRmByte(
          (reg: string) => {
            cpu.registers[reg] = cpu.rotl(cpu.registers[reg], cpu.registers.cl * dir, bits);
          },
          (address) => {
            memIO.write[bits](
              cpu.rotl(memIO.read[bits](address), registers.cl * dir, bits),
              address,
            );
          },
          bits,
        );
      },
      /** RCL r/m16, cl */ 0xD3: () => opcodes[0xD2](0x2),

      /** ROL/SHR/SHL   */ 0xD0: X86InstructionSet.switchRMOpcodeInstruction(cpu, 0x1, {
        /** ROL */ 0x0: (val, bits) => cpu.rotate(val, 0x1, bits),
        /** ROR */ 0x1: (val, bits) => cpu.rotate(val, -0x1, bits),
        /** SHL */ 0x4: (val, bits) => cpu.shl(val, 0x1, bits),
        /** SHR */ 0x5: (val, bits) => cpu.shr(val, 0x1, bits),
      }),

      /** ROL/SHR/SHL r/m8  */ 0xC0: X86InstructionSet.switchRMOpcodeInstruction(cpu, 0x1, {
        /** ROL */ 0x0: (val, bits) => cpu.rotate(val, cpu.fetchOpcode(), bits),
        /** ROR */ 0x1: (val, bits) => cpu.rotate(val, -cpu.fetchOpcode(), bits),
        /** SHL IMM8 */ 0x4: (val) => cpu.shl(val, cpu.fetchOpcode(), 0x1),
        /** SHR IMM8 */ 0x5: (val) => cpu.shr(val, cpu.fetchOpcode(), 0x1),
      }),

      /** ROL/SHR/SHL r/m16 */ 0xC1: X86InstructionSet.switchRMOpcodeInstruction(cpu, 0x2, {
        /** ROL */ 0x0: (val, bits) => cpu.rotate(val, cpu.fetchOpcode(), bits),
        /** ROR */ 0x1: (val, bits) => cpu.rotate(val, -cpu.fetchOpcode(), bits),
        /** SHL IMM8 */ 0x4: (val) => cpu.shl(val, cpu.fetchOpcode(), 0x2),
        /** SHR IMM8 */ 0x5: (val) => cpu.shr(val, cpu.fetchOpcode(), 0x2),
      }),

      /** ROR r/m8, 1   */ 0xD1: () => opcodes[0xD0](0x2),

      /** CBW */ 0x98: () => {
        registers.ah = (registers.al & 0x80) === 0x80 ? 0xFF : 0x0;
      },
      /** CWD */ 0x99: () => {
        registers.ax = (registers.ax & 0x8000) === 0x8000 ? 0xFFFF : 0x0;
      },

      /** SALC */ 0xD6: () => {
        registers.al = registers.status.cf ? 0xFF : 0x0;
      },

      /** XCHG bx, bx */ 0x87: () => {
        const arg = cpu.fetchOpcode(0x1, false, true);

        switch (arg) {
          case 0xDB: // xchg bx, bx
          case 0xD2: // xchg dx, dx
            cpu.incrementIP(0x1);
            cpu.debugDumpRegisters();

            if (arg === 0xDB) // xchg dx, dx
              debugger; // eslint-disable-line no-debugger
            break;

          default:
            cpu.parseRmByte(
              (reg, reg2) => {
                [
                  registers[<string> X86_REGISTERS[0x2][reg2]],
                  registers[<string> reg],
                ] = [
                  registers[reg],
                  registers[X86_REGISTERS[0x2][reg2]],
                ];
              },
              () => { throw new Error('todo: xchg in mem address'); },
              0x2,
            );
        }
      },

      /** HLT */ 0xF4: cpu.halt.bind(cpu),

      /** ICE BreakPoint */ 0xF1: () => {},
      /** NOP */ 0x90: () => {},
    });

    /** General usage registers opcodes */
    for (let opcode = 0; opcode < Object.keys(X86_REGISTERS[0x1]).length; ++opcode) {
      /** MOV register opcodes */
      ((_opcode) => {
        const _r8: string = X86_REGISTERS[0x1][_opcode];
        const _r16: string = X86_REGISTERS[0x2][_opcode];

        /** XCHG AX, r16 */ opcodes[0x90 + _opcode] = () => {
          const dest = X86_REGISTERS[0x2][_opcode],
            temp = <number> cpu.registers[dest];

          registers[<string> dest] = registers.ax;
          registers.ax = temp;
        };

        /** MOV reg8, imm8 $B0 + reg8 code */
        opcodes[0xB0 + _opcode] = () => { registers[_r8] = cpu.fetchOpcode(); };

        /** MOV reg16, imm16 $B8 + reg16 code */
        opcodes[0xB8 + _opcode] = () => { registers[_r16] = cpu.fetchOpcode(0x2); };

        /** INC reg16 */
        opcodes[0x40 + _opcode] = () => {
          registers[_r16] = alu.exec(alu.operators.extra.increment, registers[_r16], null, 0x2);
        };

        /** DEC reg16 */
        opcodes[0x48 + _opcode] = () => {
          registers[_r16] = alu.exec(alu.operators.extra.decrement, registers[_r16], null, 0x2);
        };

        /** PUSH reg16 */
        opcodes[0x50 + _opcode] = () => stack.push(registers[_r16]);

        /** POP reg16 */
        opcodes[0x58 + _opcode] = () => { registers[_r16] = stack.pop(); };
      })(opcode);
    }
  }

  /**
   * Inits opcodes that are related to jumps
   *
   * @static
   * @param {X86CPU} cpu
   * @memberof X86InstructionSet
   */
  static initBranchOpcodes(cpu: X86CPU): void {
    const {registers, opcodes} = cpu;

    const jmpOpcodes: {[offset: number]: X86FlagCondition} = {
      /** JO  */ 0x70: (f) => f.of,
      /** JNO */ 0x71: (f) => !f.of,
      /** JB  */ 0x72: (f) => f.cf,
      /** JAE */ 0x73: (f) => !f.cf,
      /** JZ  */ 0x74: (f) => f.zf,
      /** JNE */ 0x75: (f) => !f.zf,
      /** JBE */ 0x76: (f) => f.cf || f.zf,
      /** JA  */ 0x77: (f) => !f.cf && !f.zf,
      /** JS  */ 0x78: (f) => f.sf,
      /** JNS */ 0x79: (f) => !f.sf,
      /** JP  */ 0x7A: (f) => f.pf,
      /** JNP */ 0x7B: (f) => !f.pf,
      /** JG  */ 0x7F: (f) => !f.zf && f.sf === f.of,
      /** JGE */ 0x7D: (f) => f.sf === f.of,
      /** JL  */ 0x7C: (f) => f.sf !== f.of,
      /** JLE */ 0x7E: (f) => f.zf || f.sf !== f.of,
    };

    const jumpIf = (flagCondition: X86FlagCondition, bits: X86BitsMode = 0x1) => {
      const relative = cpu.fetchOpcode(bits);

      if (flagCondition(registers.status))
        cpu.relativeJump(bits, relative);
    };

    R.forEachObjIndexed(
      (jmpFn, opcode) => {
        opcodes[opcode] = () => jumpIf(jmpFn);
        opcodes[(0x0F << 0x8) | (+opcode + 0x10)] = () => jumpIf(jmpFn, 0x2);
      },
      jmpOpcodes,
    );
  }
}
