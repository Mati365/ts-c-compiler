import { getMSbit } from '@ts-cc/core';
import { BINARY_MASKS } from '@ts-cc/core';
import {
  X86BitsMode,
  RMByte,
  toUnsignedNumber,
  signExtend,
  getSignedNumber,
} from '@ts-cc/x86-assembler';

import {
  X86_REGISTERS,
  X86_FLAGS_OFFSETS,
  X86_FLAGS_MASKS,
  X86_BINARY_MASKS,
  X86_FLAGS_ALL_ALU_MASK,
} from './constants/x86';

import { X86CPU } from './X86CPU';
import { X86Unit } from './X86Unit';
import { X86Interrupt } from './parts';

type ALUOperatorSchema = {
  _c: (a: number, b?: number) => number;
  _flagOnly?: boolean;
  offset?: number;
  clear?: number;
  set?: number;
  negativeRightOperand?: boolean;
};

type ALUOperatorsSchemaSet = { [offset: number]: ALUOperatorSchema } & {
  extra: {
    increment: ALUOperatorSchema;
    decrement: ALUOperatorSchema;
  };
};

type ALUFlagChecker = (
  signed: number,
  bits: X86BitsMode,
  l?: number,
  r?: number,
  val?: number,
  operator?: ALUOperatorSchema,
) => number | boolean;

/**
 * Codes of ALU operators
 */
export enum X86ALUOperator {
  SBB = 0b011,
  ADC = 0b010,
  ADD = 0b000,
  SUB = 0b101,
  AND = 0b100,
  OR = 0b001,
  XOR = 0b110,
  COMPARE = 0b111,
}

/**
 * Arithmetic logic unit
 */
export class X86ALU extends X86Unit {
  public operators: ALUOperatorsSchemaSet;

  protected static flagsCheckersMap: {
    [key in keyof typeof X86_FLAGS_OFFSETS]?: ALUFlagChecker;
  } = {
    /** Carry flag */ cf: (signed, bits, l, r, val) => val !== signed,
    /**
     * Overflow occurs when the result of adding two positive numbers
     * is negative or the result of adding two negative numbers is positive.
     * For instance: +127+1=?
     *
     * @todo Not sure if it works correctly
     * @see http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
     */
    of: (signed, bits, l, r, val, operator) => {
      const lBit = getMSbit(l, bits);
      let rBit = getMSbit(r, bits);

      // overflows in substract mode is really adding with
      // second argument containing negative sign
      if (operator.negativeRightOperand) {
        rBit ^= 1;
      }

      return lBit === rBit && lBit !== getMSbit(signed, bits);
    },
    /** Parity flag */ pf: signed => {
      /**
       * Use SWAR algorithm
       * @see http://stackoverflow.com/a/109025/6635215
       */
      signed -= (signed >> 1) & 0x55555555;
      signed = (signed & 0x33333333) + ((signed >> 2) & 0x33333333);
      signed = (((signed + (signed >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
      return !(signed % 2);
    },
    /** Zero flag */ zf: (signed, bits) => (signed & X86_BINARY_MASKS[bits]) === 0x0,
    /** Sign flag */ sf: (signed, bits) => getMSbit(signed, bits) === 0x1,
  };

  setZSPFlags(num: number, bits: X86BitsMode): void {
    const {
      registers: { status },
    } = this.cpu;
    const { flagsCheckersMap } = X86ALU;

    status.zf = +flagsCheckersMap.zf(num, bits);
    status.sf = +flagsCheckersMap.sf(num, bits);
    status.pf = +flagsCheckersMap.pf(num, bits);
  }

  /**
   * Performs ALU operation, sets flags and other stuff
   */
  exec(
    operator: ALUOperatorSchema,
    l: number,
    r: number,
    bits: X86BitsMode = 0x1,
  ): number {
    const { registers } = this.cpu;
    const { status } = registers;
    const { flagsCheckersMap } = X86ALU;

    l = l || 0;
    r = r || 0;

    /** Clear flags */
    if (operator.clear) {
      registers.flags &= ~operator.clear;
    }

    /** Set default flags value for operator */
    const val = operator._c(l, r),
      signed = toUnsignedNumber(val, bits);

    if (typeof operator.set === 'undefined') {
      operator.set = 0xff;
    }

    /** Set all CPU flags */
    const { set: updatedChecker } = operator;

    if (updatedChecker & X86_FLAGS_MASKS.zf) {
      status.zf = +flagsCheckersMap.zf(signed, bits);
    }

    if (updatedChecker & X86_FLAGS_MASKS.sf) {
      status.sf = +flagsCheckersMap.sf(signed, bits);
    }

    if (updatedChecker & X86_FLAGS_MASKS.pf) {
      status.pf = +flagsCheckersMap.pf(signed, bits);
    }

    if (updatedChecker & X86_FLAGS_MASKS.cf) {
      status.cf = +flagsCheckersMap.cf(signed, bits, l, r, val, operator);
    }

    if (updatedChecker & X86_FLAGS_MASKS.of) {
      status.of = +flagsCheckersMap.of(signed, bits, l, r, val, operator);
    }

    /** temp - for cmp and temporary operations */
    return operator._flagOnly ? null : signed;
  }

  /**
   * Init ALU, append instructions to CPU
   */
  protected init(cpu: X86CPU) {
    this.initOperatorsSchema(cpu);
    this.initOperatorsOpcodes(cpu);
    this.initExtraOpcodes(cpu);
  }

  /**
   * Creates list of operators that can be used in ALU
   *
   * @todo
   *  Store it as array, not object. It should be faster!
   */
  private initOperatorsSchema(cpu: X86CPU): void {
    this.operators = {
      /** Extra operators used in other opcodes */
      extra: {
        increment: {
          _c: s => s + 1,
          set: X86_FLAGS_ALL_ALU_MASK,
        },
        decrement: {
          _c: s => s - 1,
          negativeRightOperand: true,
          set: X86_FLAGS_ALL_ALU_MASK,
        },
      },
      /** SBB */ [X86ALUOperator.SBB]: {
        offset: 0x18,
        set: X86_FLAGS_ALL_ALU_MASK,
        _c: (s, d) => s - d - cpu.registers.status.cf,
      },
      /** ADC */ [X86ALUOperator.ADC]: {
        offset: 0x10,
        set: X86_FLAGS_ALL_ALU_MASK,
        _c: (s, d) => s + d + cpu.registers.status.cf,
      },

      /** + */ [X86ALUOperator.ADD]: {
        offset: 0x00,
        set: X86_FLAGS_ALL_ALU_MASK,
        _c: (s, d) => s + d,
      },
      /** - */ [X86ALUOperator.SUB]: {
        offset: 0x28,
        set: X86_FLAGS_ALL_ALU_MASK,
        negativeRightOperand: true,
        _c: (s, d) => s - d,
      },
      /** & */ [X86ALUOperator.AND]: {
        offset: 0x20,
        clear: X86_FLAGS_MASKS.cf | X86_FLAGS_MASKS.of,
        set: X86_FLAGS_MASKS.sf | X86_FLAGS_MASKS.pf | X86_FLAGS_MASKS.zf,
        _c: (s, d) => s & d,
      },
      /** | */ [X86ALUOperator.OR]: {
        offset: 0x08,
        clear: X86_FLAGS_MASKS.cf | X86_FLAGS_MASKS.of,
        set: X86_FLAGS_MASKS.sf | X86_FLAGS_MASKS.pf | X86_FLAGS_MASKS.zf,
        _c: (s, d) => s | d,
      },
      /** ^ */ [X86ALUOperator.XOR]: {
        offset: 0x30,
        clear: X86_FLAGS_MASKS.cf | X86_FLAGS_MASKS.of,
        set: X86_FLAGS_MASKS.sf | X86_FLAGS_MASKS.pf | X86_FLAGS_MASKS.zf,
        _c: (s, d) => s ^ d,
      },
      /** = */ [X86ALUOperator.COMPARE]: {
        set: X86_FLAGS_ALL_ALU_MASK,
        offset: 0x38,
        negativeRightOperand: true,
        _flagOnly: true,
        _c: (s, d) => s - d,
      },
    };
  }

  /**
   * Parses RM byte and decodes multipler operator
   */
  protected rmByteMultiplierParse(
    bits: X86BitsMode,
    mul: (a: number, byte: RMByte) => void,
  ): void {
    const { cpu } = this;
    const { memIO, registers } = cpu;
    const { operators } = this;

    cpu.parseRmByte(
      (reg: string, _, byte) => {
        if (byte.reg === 0 || byte.reg === 1) {
          /** TEST r imm8 */
          this.exec(operators[0b100], registers[reg], cpu.fetchOpcode(bits), bits);
        } else if (byte.reg === 0x2) {
          /** NOT */
          registers[reg] = ~registers[reg] & BINARY_MASKS[bits];
        } else if (byte.reg === 0x3) {
          /** NEG */
          registers[reg] = this.exec(operators[0b101], 0, registers[reg], bits);
        } else {
          mul(registers[reg], byte);
        }
        /** MUL */
      },
      (address, _, byte) => {
        const val = memIO.read[bits](address);
        if (byte.reg === 0 || byte.reg === 1) {
          /** TEST mem imm8 */
          this.exec(operators[0b100], val, cpu.fetchOpcode(bits), bits);
        } else if (byte.reg === 0x2) {
          /** NOT */
          memIO.write[bits](~val & BINARY_MASKS[bits], address);
        } else if (byte.reg === 0x3) {
          /** NEG */
          memIO.write[bits](this.exec(this.operators[0b101], 0, val, bits), address);
        } else {
          mul(val, byte);
        }
        /** MUL */
      },
      bits,
    );
  }

  /**
   * Init opcodes that are used by basic operators
   */
  protected initOperatorsOpcodes(cpu: X86CPU): void {
    const { registers, memIO } = cpu;

    for (const key in this.operators) {
      if (key === 'extra') {
        continue;
      }

      (op => {
        const { offset } = op;
        const codes = {
          /** OPERATOR r/m8, r8 */ [0x0 + offset]: (bits: X86BitsMode = 0x1) => {
            cpu.parseRmByte(
              (reg: string, modeReg) => {
                const result = this.exec(
                  op,
                  registers[reg],
                  registers[<string>X86_REGISTERS[bits][modeReg]],
                  bits,
                );

                if (result !== null) {
                  registers[reg] = result;
                }
              },
              (address, reg: string) => {
                const result = this.exec(
                  op,
                  memIO.read[bits](address),
                  registers[reg],
                  bits,
                );

                if (result !== null) {
                  registers[reg] = result;
                }
              },
              bits,
            );
          },
          /** OPERATOR m8, r/m8 */ [0x2 + offset]: (bits: X86BitsMode = 0x1) => {
            cpu.parseRmByte(
              (reg: string, modeReg) => {
                const dest: string = X86_REGISTERS[bits][modeReg];
                const result = this.exec(op, registers[reg], registers[dest], bits);

                if (result !== null) {
                  registers[dest] = result;
                }
              },
              (address, reg: string) => {
                const result = this.exec(
                  op,
                  registers[reg],
                  memIO.read[bits](address),
                  bits,
                );

                if (result !== null) {
                  registers[reg] = result;
                }
              },
              bits,
            );
          },
          /** OPERATOR AL, imm8 */ [0x4 + offset]: (bits: X86BitsMode = 0x1) => {
            const result = this.exec(
              op,
              registers[<string>X86_REGISTERS[bits][0]],
              cpu.fetchOpcode(bits),
              bits,
            );

            if (result !== null) {
              registers[<string>X86_REGISTERS[bits][0]] = result;
            }
          },

          /** OPERATOR AX, imm16  */ [0x5 + offset]: () => cpu.opcodes[0x4 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x1 + offset]: () => cpu.opcodes[0x0 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x3 + offset]: () => cpu.opcodes[0x2 + offset](0x2),
        };
        Object.assign(cpu.opcodes, codes);
      })(this.operators[key]);
    }
  }

  /**
   * Creates CPU opcodes list
   */
  protected initExtraOpcodes(cpu: X86CPU): void {
    const { memIO, registers, opcodes } = cpu;
    const { operators } = this;

    /** $80, $81, $82 RM Byte specific */
    Object.assign(opcodes, {
      /** CMPSB */ 0xa6: (bits: X86BitsMode = 0x1) => {
        this.exec(
          this.operators[0b111],
          memIO.read[bits](cpu.getMemAddress('es', 'di')),
          memIO.read[bits](cpu.getMemAddress('ds', 'si')),
          bits,
        );

        /** Increment indexes */
        cpu.dfIncrement(bits, 'di', 'si');
      },
      /** CMPSW */ 0xa7: () => opcodes[0xa6](0x2),

      /** TEST al, imm8 */ 0xa8: (bits: X86BitsMode = 0x1) => {
        this.exec(
          operators[0b100],
          registers[<string>X86_REGISTERS[bits][0x0]],
          cpu.fetchOpcode(bits),
        );
      },
      /** TEST ax, imm16  */ 0xa9: () => opcodes[0xa8](0x2),
      /** TEST r/m8, r8   */ 0x84: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            this.exec(
              this.operators[0b100],
              registers[<string>reg],
              registers[<string>X86_REGISTERS[bits][modeReg]],
            );
          },
          (address, reg) => {
            this.exec(
              this.operators[0b100],
              registers[<string>reg],
              memIO.read[bits](address),
            );
          },
          bits,
        );
      },
      /** TEST r/m16, r16 */ 0x85: () => opcodes[0x84](0x2),

      /** OPERATOR r/m8, imm8 */ 0x80: (
        bits: X86BitsMode = 0x1,
        src: X86BitsMode = bits,
      ) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            const imm = signExtend(cpu.fetchOpcode(src), src, bits);

            const result = this.exec(
              this.operators[modeReg],
              registers[<string>reg],
              imm,
              bits,
            );

            if (result !== null) {
              registers[<string>reg] = result;
            }
          },
          (address, reg, mode) => {
            const imm = signExtend(cpu.fetchOpcode(src), src, bits);

            const result = this.exec(
              operators[mode.reg],
              memIO.read[bits](address),
              imm,
              bits,
            );

            if (result !== null) {
              memIO.write[bits](result, address);
            }
          },
          bits,
        );
      },
      /** OPERATOR r/m16, imm8 */ 0x83: () => opcodes[0x80](0x2, 0x1),
      /** OPERATOR r/m16, imm16 */ 0x81: () => opcodes[0x80](0x2),

      /** MULTIPLIER, TEST, NEG, NOT, IMUL al, r/m8  */ 0xf6: () =>
        this.rmByteMultiplierParse(0x1, (val, byte) => {
          const { status } = registers;

          if ((byte.reg & 0x6) === 0x6) {
            if (!val) {
              cpu.interrupt(X86Interrupt.raise.divideByZero());
              return;
            }

            if (byte.reg === 0x7) {
              /** IDIV */
              const ax = getSignedNumber(registers.ax, 0x2);
              const signedVal = getSignedNumber(val);

              registers.ax =
                toUnsignedNumber(parseInt(<any>(ax / signedVal), 10)) |
                (toUnsignedNumber(ax % signedVal) << 8);
            } else {
              /** DIV */
              registers.ax =
                parseInt(<any>(registers.ax / val), 10) | (registers.ax % val << 8);
            }
          } else {
            /** MUL / IMUL */
            registers.ax = toUnsignedNumber(
              byte.reg === 0x5
                ? getSignedNumber(registers.al) * getSignedNumber(val)
                : registers.al * val,
              0x2,
            );

            status.cf = +(byte.reg === 0x5
              ? registers.al === registers.ax
              : registers.al);
            status.of = status.cf; // checkme
          }
        }),

      /** MULTIPLIER ax, r/m16 */ 0xf7: () =>
        this.rmByteMultiplierParse(0x2, (val, byte) => {
          if ((byte.reg & 0x6) === 0x6) {
            if (!val) {
              cpu.interrupt(X86Interrupt.raise.divideByZero());
              return;
            }

            /** DIV / IDIV */
            if (byte.reg === 0x7) {
              /** IDIV */
              const num = getSignedNumber((registers.dx << 16) | registers.ax, 0x4);

              registers.ax = toUnsignedNumber(parseInt(<any>(num / val), 10), 0x2);
              registers.dx = toUnsignedNumber(num % val, 0x2);
            } else {
              /** DIV */
              const num = (registers.dx << 16) | registers.ax;

              registers.ax = parseInt(<any>(num / val), 10);
              registers.dx = num % val;
            }
          } else {
            /** MUL / IMUL */
            const output = toUnsignedNumber(
              byte.reg === 0x5
                ? getSignedNumber(registers.ax, 0x2) * getSignedNumber(val, 0x2)
                : registers.ax * val,
              0x4,
            );

            registers.ax = output & 0xffff;
            registers.dx = (output >> 16) & 0xffff;

            registers.status.cf = +(byte.reg === 0x5
              ? output === registers.ax
              : registers.dx);
            registers.status.of = registers.status.cf;
          }
        }),

      /* IMUL r16,r/m16,imm8 */ 0x6b: (immBits: X86BitsMode = 0x1) => {
        let source1: number, source2: number, result: number;

        cpu.parseRmByte(
          (reg, modeReg) => {
            source1 = getSignedNumber(registers[<any>reg], 0x2);
            source2 = getSignedNumber(cpu.fetchOpcode(immBits), immBits);

            result = toUnsignedNumber(source1 * source2, 0x2);
            registers[<string>X86_REGISTERS[0x2][modeReg]] = result;
          },
          (address, reg: string) => {
            source1 = getSignedNumber(memIO.read[0x2](address), 0x2);
            source2 = getSignedNumber(cpu.fetchOpcode(immBits), immBits);

            result = toUnsignedNumber(source1 * source2, 0x2);
            registers[reg] = result;
          },
          0x2,
        );

        const overflow = +(source1 * source2 !== signExtend(source1 * source2, 0x2, 0x4));

        registers.status.cf = overflow;
        registers.status.of = overflow;
      },

      /* IMUL r16,r/m16,imm16 */ 0x69: () => opcodes[0x6b](0x2),

      /* IMUL r16, r/m16 */ 0x0faf: () => {
        let source1: number, source2: number, result: number;

        cpu.parseRmByte(
          (reg, modeReg) => {
            source1 = getSignedNumber(registers[<any>reg], 0x2);
            source2 = getSignedNumber(
              registers[<string>X86_REGISTERS[0x2][modeReg]],
              0x2,
            );

            result = toUnsignedNumber(source1 * source2, 0x2);
            registers[<string>X86_REGISTERS[0x2][modeReg]] = result;
          },
          (address, reg: string) => {
            source1 = getSignedNumber(memIO.read[0x2](address), 0x2);
            source2 = getSignedNumber(registers[reg]);

            result = toUnsignedNumber(source1 * source2, 0x2);
            registers[reg] = result;
          },
          0x2,
        );

        const overflow = +(source1 * source2 !== signExtend(source1 * source2, 0x2, 0x4));

        registers.status.cf = overflow;
        registers.status.of = overflow;
      },
    });
  }
}
