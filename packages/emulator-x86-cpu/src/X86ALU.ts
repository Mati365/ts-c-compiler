import {setBit, getMSbit} from '@compiler/core/utils/bits';
import {BINARY_MASKS} from '@compiler/core/constants';

import {
  X86_REGISTERS,
  X86_FLAGS_OFFSETS,
  X86_FLAGS_MASKS,
} from './constants/x86';

import {X86CPU} from './X86CPU';
import {X86Unit} from './X86Unit';
import {
  X86AbstractCPU,
  X86BitsMode,
  RMByte,
  X86Interrupt,
} from './types';

type ALUOperatorSchema = {
  _c: (a: number, b?: number) => number,
  _flagOnly?: boolean,
  offset?: number,
  clear?: number,
  set?: number,
  negativeRightOperand?: boolean,
};

type ALUOperatorsSchemaSet = {[offset: number]: ALUOperatorSchema} & {
  extra: {
    increment: ALUOperatorSchema,
    decrement: ALUOperatorSchema,
  },
};

type ALUFlagChecker = (
  signed: number,
  bits: X86BitsMode,
  l: number,
  r: number,
  val: number,
  operator: ALUOperatorSchema,
) => number|boolean;

/**
 * Codes of ALU operators
 *
 * @export
 * @enum {number}
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
 *
 * @export
 * @class X86ALU
 * @extends {X86Unit}
 */
export class X86ALU extends X86Unit {
  public operators: ALUOperatorsSchemaSet;

  /**
   * Flags used to set values in status register
   *
   * @protected
   * @static
   * @type {{[offset: number]: ALUFlagChecker}}
   * @memberof X86ALU
   */
  protected static flagsCheckers: [number, ALUFlagChecker][] = [
    /** Carry flag */ [X86_FLAGS_OFFSETS.cf, (signed, bits, l, r, val) => val !== signed],
    /**
     * Overflow occurs when the result of adding two positive numbers
     * is negative or the result of adding two negative numbers is positive.
     * For instance: +127+1=?
     *
     * @todo Not sure if it works correctly
     * @see http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
     */
    [X86_FLAGS_OFFSETS.of, (signed, bits, l, r, val, operator) => {
      const lBit = getMSbit(l, bits);
      let rBit = getMSbit(r, bits);

      // overflows in substract mode is really adding with
      // second argument containing negative sign
      if (operator.negativeRightOperand)
        rBit ^= 1;

      return lBit === rBit && lBit !== getMSbit(signed, bits);
    }],
    /** Parity flag */ [X86_FLAGS_OFFSETS.pf, (signed) => {
      /**
       * Use SWAR algorithm
       * @see http://stackoverflow.com/a/109025/6635215
       */
      signed -= ((signed >> 1) & 0x55555555);
      signed = (signed & 0x33333333) + ((signed >> 2) & 0x33333333);
      signed = (((signed + (signed >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
      return !(signed % 2);
    }],
    /** Zero flag */ [X86_FLAGS_OFFSETS.zf, (signed) => signed === 0x0],
    /** Sign flag */ [X86_FLAGS_OFFSETS.sf, (signed, bits) => getMSbit(signed, bits) === 0x1],
  ];

  /**
   * Performs ALU operation, sets flags and other stuff
   *
   * @param {ALUOperatorSchema} operator
   * @param {number} l
   * @param {number} r
   * @param {X86BitsMode} bits
   * @returns {number}
   * @memberof X86ALU
   */
  exec(operator: ALUOperatorSchema, l: number, r: number, bits: X86BitsMode = 0x1): number {
    const {flagsCheckers} = X86ALU;
    const {registers} = this.cpu;

    l = l || 0;
    r = r || 0;

    /** Clear flags */
    if (operator.clear)
      registers.flags &= ~operator.clear;

    /** Set default flags value for operator */
    const val = operator._c(l, r),
      signed = X86AbstractCPU.toUnsignedNumber(val, bits);

    if (typeof operator.set === 'undefined')
      operator.set = 0xFF;

    /**
     * Value returned after flags
     * @todo Unroll, remove loop
     */
    for (let i = 0; i < flagsCheckers.length; ++i) {
      const [offset, checker] = flagsCheckers[i];

      if (((operator.set >> offset) & 0x1) === 1) {
        const _val = checker(signed, bits, l, r, val, operator);
        registers.flags = setBit(offset, _val, registers.flags);
      }
    }

    /** temp - for cmp and temporary operations */
    return operator._flagOnly ? l : signed;
  }

  /**
   * Init ALU, append instructions to CPU
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86ALU
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
   *
   * @private
   * @param {X86CPU} cpu
   * @memberof X86ALU
   */
  private initOperatorsSchema(cpu: X86CPU): void {
    this.operators = {
      /** Extra operators used in other opcodes */
      extra: {
        increment: {
          _c: (s) => s + 1,
          set: (
            X86_FLAGS_MASKS.of
              | X86_FLAGS_MASKS.sf
              | X86_FLAGS_MASKS.zf
              | X86_FLAGS_MASKS.af
              | X86_FLAGS_MASKS.pf
          ),
        },
        decrement: {
          _c: (s) => s - 1,
          negativeRightOperand: true,
          set: (
            X86_FLAGS_MASKS.of
              | X86_FLAGS_MASKS.sf
              | X86_FLAGS_MASKS.zf
              | X86_FLAGS_MASKS.af
              | X86_FLAGS_MASKS.pf
          ),
        },
      },
      /** SBB */ [X86ALUOperator.SBB]: {
        offset: 0x18,
        _c: (s, d) => s - d - cpu.registers.status.cf,
      },
      /** ADC */ [X86ALUOperator.ADC]: {
        offset: 0x10,
        _c: (s, d) => s + d + cpu.registers.status.cf,
      },

      /** + */ [X86ALUOperator.ADD]: {
        offset: 0x00,
        _c: (s, d) => s + d,
      },
      /** - */ [X86ALUOperator.SUB]: {
        offset: 0x28,
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
        offset: 0x38,
        negativeRightOperand: true,
        _flagOnly: true,
        _c: (s, d) => s - d,
      },
    };
  }

  /**
   * Parses RM byte and decodes multipler operator
   *
   * @protected
   * @param {X86BitsMode} [bits=0x1]
   * @param {(a: number, byte: RMByte) => number} mul
   * @memberof X86ALU
   */
  protected rmByteMultiplierParse(
    bits: X86BitsMode = 0x1,
    mul: (a: number, byte: RMByte) => void,
  ): void {
    const {cpu} = this;
    const {memIO, registers} = cpu;
    const {operators} = this;

    cpu.parseRmByte(
      (reg: string, _, byte) => {
        if (byte.reg === 0 || byte.reg === 1) {
          /** TEST r imm8 */
          this.exec(
            operators[0b100],
            registers[reg],
            cpu.fetchOpcode(bits),
            bits,
          );
        } else if (byte.reg === 0x2) {
          /** NOT */
          registers[reg] = ~registers[reg] & BINARY_MASKS[bits];
        } else if (byte.reg === 0x3) {
          /** NEG */
          registers[reg] = this.exec(operators[0b101], 0, registers[reg], bits);
        } else
          /** MUL */
          mul(registers[reg], byte);
      },
      (address, _, byte) => {
        const val = memIO.read[bits](address);
        if (byte.reg === 0 || byte.reg === 1) {
          /** TEST mem imm8 */
          this.exec(
            operators[0b100],
            val,
            cpu.fetchOpcode(bits),
            bits,
          );
        } else if (byte.reg === 0x2) {
          /** NOT */
          memIO.write[bits](~val & BINARY_MASKS[bits], address);
        } else if (byte.reg === 0x3) {
          /** NEG */
          memIO.write[bits](
            this.exec(this.operators[0b101], 0, val, bits),
            address,
          );
        } else
          /** MUL */
          mul(val, byte);
      },
      bits,
    );
  }

  /**
   * Init opcodes that are used by basic operators
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86ALU
   */
  protected initOperatorsOpcodes(cpu: X86CPU): void {
    const {registers, memIO} = cpu;

    for (const key in this.operators) {
      if (key === 'extra')
        continue;

      ((op) => {
        const {offset} = op;
        const codes = {
          /** OPERATOR r/m8, r8 */ [0x0 + offset]: (bits: X86BitsMode = 0x1) => {
            cpu.parseRmByte(
              (reg: string, modeReg) => {
                registers[reg] = this.exec(
                  op,
                  registers[reg],
                  registers[<string> X86_REGISTERS[bits][modeReg]],
                  bits,
                );
              },
              (address, reg: string) => {
                memIO.write[bits](
                  this.exec(op, memIO.read[bits](address), registers[reg], bits),
                  address,
                );
              }, bits,
            );
          },
          /** OPERATOR m8, r/m8 */ [0x2 + offset]: (bits: X86BitsMode = 0x1) => {
            cpu.parseRmByte(
              (reg: string, modeReg) => {
                const dest: string = X86_REGISTERS[bits][modeReg];
                registers[dest] = this.exec(op, registers[reg], registers[dest], bits);
              },
              (address, reg: string) => {
                registers[reg] = this.exec(op, registers[reg], memIO.read[bits](address), bits);
              }, bits,
            );
          },
          /** OPERATOR AL, imm8 */ [0x4 + offset]: (bits: X86BitsMode = 0x1) => {
            registers[<string> X86_REGISTERS[bits][0]] = this.exec(
              op,
              registers[<string> X86_REGISTERS[bits][0]],
              cpu.fetchOpcode(bits),
              bits,
            );
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
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86ALU
   */
  protected initExtraOpcodes(cpu: X86CPU): void {
    const {memIO, registers, opcodes} = cpu;
    const {operators} = this;

    /** $80, $81, $82 RM Byte specific */
    Object.assign(opcodes, {
      /** CMPSB */ 0xA6: (bits: X86BitsMode = 0x1) => {
        this.exec(
          this.operators[0b111],
          memIO.read[bits](cpu.getMemAddress('es', 'di')),
          memIO.read[bits](cpu.getMemAddress('ds', 'si')),
          bits,
        );

        /** Increment indexes */
        cpu.dfIncrement(bits, 'di', 'si');
      },
      /** CMPSW */ 0xA7: () => opcodes[0xA6](0x2),

      /** TEST al, imm8 */ 0xA8: (bits: X86BitsMode = 0x1) => {
        this.exec(operators[0b100], registers[<string> X86_REGISTERS[bits][0x0]], cpu.fetchOpcode(bits));
      },
      /** TEST ax, imm16  */ 0xA9: () => opcodes[0xA8](0x2),
      /** TEST r/m8, r8   */ 0x84: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            this.exec(this.operators[0b100], registers[<string> reg], registers[<string> X86_REGISTERS[bits][modeReg]]);
          },
          (address, reg) => {
            this.exec(this.operators[0b100], registers[<string> reg], memIO.read[bits](address));
          },
          bits,
        );
      },
      /** TEST r/m16, r16 */ 0x85: () => opcodes[0x84](0x2),

      /** OPERATOR r/m8, imm8 */ 0x80: (bits: X86BitsMode = 0x1, src: X86BitsMode = bits) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            const imm = X86AbstractCPU.signExtend(cpu.fetchOpcode(src), src, bits);

            registers[<string> reg] = this.exec(
              this.operators[modeReg],
              registers[<string> reg],
              imm,
              bits,
            );
          },
          (address, reg, mode) => {
            const imm = X86AbstractCPU.signExtend(cpu.fetchOpcode(src), src, bits);

            memIO.write[bits](
              this.exec(
                operators[mode.reg],
                memIO.read[bits](address),
                imm,
                bits,
              ),
              address,
            );
          },
          bits,
        );
      },
      /** OPERATOR r/m16, imm8 */ 0x83: () => opcodes[0x80](0x2, 0x1),
      /** OPERATOR r/m16, imm16 */ 0x81: () => opcodes[0x80](0x2),

      /** MULTIPLIER, TEST, NEG, NOT, IMUL al, r/m8  */ 0xF6: () => this.rmByteMultiplierParse(0x1, (val, byte) => {
        const {status} = registers;

        if ((byte.reg & 0x6) === 0x6) {
          if (!val) {
            cpu.interrupt(
              X86Interrupt.raise.divideByZero(),
            );
            return;
          }

          if (byte.reg === 0x7) {
            /** IDIV */
            const _ax = X86AbstractCPU.getSignedNumber(registers.ax, 0x2),
              _val = X86AbstractCPU.getSignedNumber(val);

            registers.ax = (
              X86AbstractCPU.toUnsignedNumber(parseInt(<any> (_ax / _val), 10))
                | (X86AbstractCPU.toUnsignedNumber((_ax % _val)) << 8)
            );
          } else {
            /** DIV */
            registers.ax = parseInt(<any> (registers.ax / val), 10) | ((registers.ax % val) << 8);
          }
        } else {
          /** MUL / IMUL */
          registers.ax = X86AbstractCPU.toUnsignedNumber(
            byte.reg === 0x5
              ? X86AbstractCPU.getSignedNumber(registers.al) * X86AbstractCPU.getSignedNumber(val)
              : (registers.al * val),
            0x2,
          );

          status.cf = +(
            byte.reg === 0x5
              ? registers.al === registers.ax
              : registers.al
          );
          status.of = status.cf; // checkme
        }
      }),
      /** MULTIPLIER ax, r/m16 */ 0xF7: () => this.rmByteMultiplierParse(0x2, (val, byte) => {
        if ((byte.reg & 0x6) === 0x6) {
          if (!val) {
            cpu.interrupt(
              X86Interrupt.raise.divideByZero(),
            );
            return;
          }

          /** DIV / IDIV */
          if (byte.reg === 0x7) {
            /** IDIV */
            const num = X86AbstractCPU.getSignedNumber((registers.dx << 16) | registers.ax, 0x4);

            registers.ax = X86AbstractCPU.toUnsignedNumber(parseInt(<any> (num / val), 10), 0x2);
            registers.dx = X86AbstractCPU.toUnsignedNumber(num % val, 0x2);
          } else {
            /** DIV */
            const num = (registers.dx << 16) | registers.ax;

            registers.ax = parseInt(<any> (num / val), 10);
            registers.dx = num % val;
          }
        } else {
          /** MUL / IMUL */
          const output = X86AbstractCPU.toUnsignedNumber(
            byte.reg === 0x5
              ? X86AbstractCPU.getSignedNumber(registers.ax, 0x2) * X86AbstractCPU.getSignedNumber(val, 0x2)
              : (registers.ax * val),
            0x4,
          );

          registers.ax = output & 0xFFFF;
          registers.dx = (output >> 16) & 0xFFFF;

          registers.status.cf = +(
            byte.reg === 0x5
              ? output === registers.ax
              : registers.dx
          );
          registers.status.of = registers.status.cf;
        }
      }),
    });
  }
}
