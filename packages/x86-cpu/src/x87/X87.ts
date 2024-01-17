/* eslint-disable max-len */
import Long from 'long';
import { getSignedNumber } from '@ts-c-compiler/x86-assembler';

import { X86Unit } from '../X86Unit';
import { X87RegsStore, X87Tag } from './X87Regs';
import { X86InstructionSet } from '../X86InstructionSet';
import { X86OpcodesList } from '../X86CPU';
import { X87Error, X87ErrorCode } from './X87Error';

/**
 * Floating point intel 8087 fpu
 */
export class X87 extends X86Unit {
  static PREDEFINED_CONSTANTS = {
    ZERO: +0.0,
    ONE: +1.0,
    L2T: Math.LOG10E,
    L2E: Math.LOG2E,
    PI: Math.PI,
    LG2: Math.log10(2),
    LN2: Math.log(Math.E),
  };

  private registers: X87RegsStore;
  private opcodes: X86OpcodesList;

  static isX87Opcode(opcode: number): boolean {
    return opcode === 0x9b || (opcode >= 0xd8 && opcode <= 0xdf);
  }

  /**
   * Round value
   */
  static truncate(num: number): number {
    return num > 0 ? Math.floor(num) : Math.ceil(num);
  }

  /**
   * Returns number parts of digit
   */
  static numberParts(num: number) {
    const float = new Float64Array(1);
    const bytes = new Uint8Array(float.buffer);

    float[0] = num;

    const sign = bytes[7] >> 7;
    const exponent = (((bytes[7] & 0x7f) << 4) | (bytes[6] >> 4)) - 0x3ff;

    bytes[7] = 0x3f;
    bytes[6] |= 0xf0;

    return {
      mantissa: float[0],
      sign,
      exponent,
    };
  }

  /**
   * Prints to console all registers
   */
  debugDumpRegisters() {
    const { cpu, registers } = this;

    if (registers.isStackInitialized()) {
      cpu.logger.table(registers.debugDump().regs);
    } else {
      console.warn('FPU is not initialized!');
    }
  }

  /**
   * Handles opcode
   */
  tick(opcode: number) {
    const { opcodes, cpu, registers } = this;
    const operand = opcodes[opcode];

    if (operand) {
      registers.stackFault = false;
      registers.invalidOperation = false;

      registers.fip = cpu.registers.ip - 0x1; // remove already fetched opcode
      registers.fdp = 0x0; // todo

      operand();

      registers.lastInstructionOpcode = opcode;
    } else {
      cpu.halt(`Unknown FPU opcode 0x${opcode.toString(16).toUpperCase()}`);
    }
  }

  /**
   * Checks FPU operand flags and sets them
   */
  checkOperandFlags(a: number, b: number): boolean {
    const { registers } = this;

    if (
      Number.isNaN(a) ||
      Number.isNaN(b) ||
      (a !== 0 && !Number.isFinite(a)) ||
      (b !== 0 && !Number.isFinite(b))
    ) {
      registers.invalidOperation = true;

      if (!registers.invalidOpExceptionMask) {
        throw new X87Error(X87ErrorCode.INVALID_ARITHMETIC_OPERATION);
      }

      return false;
    }

    return true;
  }

  /**
   * Divides number by number, if b zero throws div exception
   */
  fdiv(a: number, b: number): number {
    const { registers } = this;

    if (!b) {
      registers.zeroDivide = true;
      if (!registers.zeroDivExceptionMask) {
        throw new X87Error(X87ErrorCode.DIVIDE_BY_ZERO);
      }
    } else {
      registers.zeroDivide = false;
      this.checkOperandFlags(a, b);
    }

    return a / b;
  }

  /**
   * Substract values, check flags
   */
  fsub(a: number, b: number): number {
    this.checkOperandFlags(a, b);
    return a - b;
  }

  /**
   * Add values, check flags
   */
  fadd(a: number, b: number): number {
    this.checkOperandFlags(a, b);
    return a + b;
  }

  /**
   * Multiplies values, check flags
   */
  fmul(a: number, b: number): number {
    this.checkOperandFlags(a, b);
    return a * b;
  }

  /**
   * Compares two numbers
   */
  fcom(a: number, b: number): void {
    const { registers: regs } = this;

    regs.c1 = false;

    if (!this.checkOperandFlags(a, b)) {
      regs.c3 = true;
      regs.c2 = true;
      regs.c0 = true;
    } else if (a > b) {
      regs.c3 = false;
      regs.c2 = false;
      regs.c0 = false;
    } else if (a < b) {
      regs.c3 = false;
      regs.c2 = false;
      regs.c0 = true;
    } else if (a === b) {
      regs.c3 = true;
      regs.c2 = false;
      regs.c0 = false;
    }
  }

  /**
   * @todo
   *  Add unordered compare
   */
  fucom(a: number, b: number): void {
    this.fcom(a, b);
  }

  /**
   * Checks number and sets flags
   */
  fxam(): void {
    const { registers: regs } = this;
    const num = regs.st0;

    if (Number.isNaN(num)) {
      regs.c3 = false;
      regs.c2 = false;
      regs.c0 = false;
    } else if (!Number.isFinite(num)) {
      regs.c3 = false;
      regs.c2 = true;
      regs.c0 = true;
    } else if (!num) {
      regs.c3 = true;
      regs.c2 = false;
      regs.c0 = false;
    } else if (regs.getNthTag(0) === X87Tag.EMPTY) {
      regs.c3 = true;
      regs.c2 = false;
      regs.c0 = true;
    } else {
      regs.c3 = false;
      regs.c2 = true;
      regs.c0 = false;
    }

    // todo: add unsupported, denormal
  }

  /**
   * Stores ST0 at address
   */
  fist(byteSize: number, destAddress: number): void {
    const { cpu, registers } = this;
    const long = Long.fromNumber(registers.st0).toBytesBE();

    long.splice(0, long.length - byteSize);
    cpu.memIO.writeBytesLE(destAddress, long);
  }

  /**
   * Store FPU env
   *
   * @see {@link https://www.felixcloutier.com/x86/fstenv:fnstenv}
   * @see {@link https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-1-manual.pdf}
   * Figure 8-10. Real Mode x87 FPU State Image in Memory, 32-Bit Format
   *
   * @see
   *  Not sure if it is correct for real mode
   */
  fstenv(destAddress: number): number {
    const {
      cpu: { memIO },
      registers: regs,
    } = this;

    let offset = 0;
    memIO.write[0x2](regs.control, destAddress);
    offset += 2;
    memIO.write[0x2](regs.status, destAddress + offset);
    offset += 2;
    memIO.write[0x2](regs.tags, destAddress + offset);
    offset += 2;
    memIO.write[0x2](regs.fip, destAddress + offset);
    offset += 2;
    memIO.write[0x2](regs.fcs, destAddress + offset);
    offset += 2;
    memIO.write[0x2](regs.fdp, destAddress + offset);
    offset += 2;
    memIO.write[0x2](regs.fds, destAddress + offset);
    offset += 2;
    return offset;
  }

  /**
   * Load env
   *
   * @see
   *  Not sure if it is correct for real mode
   */
  fldenv(srcAddress: number): number {
    const {
      cpu: { memIO },
      registers: regs,
    } = this;

    let offset = 0;
    regs.control = memIO.read[0x2](srcAddress);
    offset += 2;

    regs.setStatus(memIO.read[0x2](srcAddress + offset));
    offset += 2;

    regs.tags = memIO.read[0x2](srcAddress + offset);
    offset += 2;

    regs.fip = memIO.read[0x2](srcAddress + offset);
    offset += 2;

    regs.fcs = memIO.read[0x2](srcAddress + offset);
    offset += 2;

    regs.fdp = memIO.read[0x2](srcAddress + offset);
    offset += 2;

    regs.fds = memIO.read[0x2](srcAddress + offset);
    offset += 2;

    return offset;
  }

  /**
   * Saves whole FPU state into mem addr
   */
  fsave(destAddress: number): void {
    const {
      cpu: { memIO },
      registers: regs,
    } = this;
    let offset = this.fstenv(destAddress);

    for (let i = 0; i < 8; ++i) {
      memIO.ieee754.write.extended(regs.nth(i), destAddress + offset);
      offset += 10;
    }

    regs.reset();
  }

  /**
   * Loads whole FPU state from mem addr
   */
  frstor(srcAddress: number): void {
    const {
      cpu: { memIO },
      registers: regs,
    } = this;
    let offset = this.fldenv(srcAddress);

    for (let i = 0; i < 8; ++i) {
      regs.setNthValue(
        i,
        memIO.ieee754.read.extended(srcAddress + offset),
        true,
      );
      offset += 10;
    }
  }

  /**
   * Loads FPU
   */
  init() {
    this.registers = new X87RegsStore();
    this.opcodes = [];

    const { cpu, registers: regs } = this;
    const { memIO } = cpu;
    const { ieee754: ieee754Mem } = memIO;

    Object.assign(this.opcodes, {
      0x9b: () => {
        const bits = cpu.fetchOpcode(0x2, false);
        switch (bits) {
          /* FINIT */ case 0xe3db:
            regs.reset();
            cpu.incrementIP(0x2);
            break;

          /* FCLEX */ case 0xe2db:
            regs.status = 0x0;
            cpu.incrementIP(0x2);
            break;

          /* FENI */ case 0xe0db:
          /* FDISI */ case 0xe1db:
            cpu.incrementIP(0x2);
            break;

          default:
          /* FWAIT */
        }
      },

      0xd8: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          /* D8 C0+i FADD ST(0), ST(i) */
          if (byte >= 0xc0 && byte <= 0xc7) {
            regs.setNthValue(0x0, this.fadd(regs.st0, regs.nth(byte - 0xc0)));
            return 1;
          }

          /* D8 C8+i FMUL ST(0), ST(i) */
          if (byte >= 0xc8 && byte <= 0xcf) {
            regs.setNthValue(0x0, this.fmul(regs.st0, regs.nth(byte - 0xc8)));
            return 1;
          }

          /* D8 D0+i FCOM ST(i) */
          if (byte >= 0xd0 && byte <= 0xd7) {
            this.fcom(regs.st0, regs.nth(byte - 0xd0));
            return 1;
          }

          /* D8 D8+i FCOMP ST(i) */
          if (byte >= 0xd8 && byte <= 0xdf) {
            this.fcom(regs.st0, regs.nth(byte - 0xd8));
            regs.safePop();
            return 1;
          }

          /* D8 E0+i FSUB ST(0), ST(i) */
          if (byte >= 0xe0 && byte <= 0xe7) {
            regs.setNthValue(0x0, this.fsub(regs.st0, regs.nth(byte - 0xe0)));
            return 1;
          }

          /* D8 E8+i FSUBR ST(0), ST(i) */
          if (byte >= 0xe8 && byte <= 0xef) {
            regs.setNthValue(0x0, this.fsub(regs.nth(byte - 0xe8), regs.st0));
            return 1;
          }

          /* D8 F0+i FDIV ST(0), ST(i) */
          if (byte >= 0xf0 && byte <= 0xf7) {
            regs.setNthValue(0x0, this.fdiv(regs.st0, regs.nth(byte - 0xf0)));
            return 1;
          }

          /* D8 F8+i FDIVR ST(0), ST(i) */
          if (byte >= 0xf8 && byte <= 0xff) {
            regs.setNthValue(0x0, this.fdiv(regs.nth(byte - 0xf8), regs.st0));
            return 1;
          }

          return 0;
        },

        /* FADD mdr(32) */ 0x0: address => {
          regs.setNthValue(
            0x0,
            this.fadd(regs.st0, ieee754Mem.read.single(address)),
          );
        },
        /* FMUL mdr(32) */ 0x1: address => {
          regs.setNthValue(
            0x0,
            this.fmul(regs.st0, ieee754Mem.read.single(address)),
          );
        },
        /* FCOM mdr(32) */ 0x2: address => {
          this.fcom(regs.st0, ieee754Mem.read.single(address));
        },
        /* FCOMP mdr(32) */ 0x3: address => {
          this.fcom(regs.st0, ieee754Mem.read.single(address));
          regs.safePop();
        },

        /* FSUB mdr(32) */ 0x4: address => {
          regs.setNthValue(
            0x0,
            this.fsub(regs.st0, ieee754Mem.read.single(address)),
          );
        },
        /* FSUBR mdr(32) */ 0x5: address => {
          regs.setNthValue(
            0x0,
            this.fsub(ieee754Mem.read.single(address), regs.st0),
          );
        },
        /* FDIV mdr(32) */ 0x6: address => {
          regs.setNthValue(
            0x0,
            this.fdiv(regs.st0, ieee754Mem.read.single(address)),
          );
        },
        /* FDIVR mdr(32) */ 0x7: address => {
          regs.setNthValue(
            0x0,
            this.fdiv(ieee754Mem.read.single(address), regs.st0),
          );
        },
      }),

      0xd9: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          switch (byte) {
            /* FNOP */ case 0xd0:
              return 1;

            /* FCHS */ case 0xe0:
              regs.setNthValue(0x0, -regs.st0);
              return 1;
            /* FABS */ case 0xe1:
              regs.setNthValue(0x0, Math.abs(regs.st0));
              return 1;
            /* FTST */ case 0xe4:
              this.fcom(regs.st0, 0.0);
              return 1;
            /* FXAM */ case 0xe5:
              this.fxam();
              return 1;
            /* FLD1 */ case 0xe8:
              regs.safePush(X87.PREDEFINED_CONSTANTS.ONE);
              return 1;
            /* FLDL2T */ case 0xe9:
              regs.safePush(X87.PREDEFINED_CONSTANTS.L2T);
              return 1;
            /* FLDL2E */ case 0xea:
              regs.safePush(X87.PREDEFINED_CONSTANTS.L2E);
              return 1;
            /* FLDPI */ case 0xeb:
              regs.safePush(X87.PREDEFINED_CONSTANTS.PI);
              return 1;
            /* FLDLG2 */ case 0xec:
              regs.safePush(X87.PREDEFINED_CONSTANTS.LG2);
              return 1;
            /* FLDLN2 */ case 0xed:
              regs.safePush(X87.PREDEFINED_CONSTANTS.LN2);
              return 1;
            /* FLDZ */ case 0xee:
              regs.safePush(X87.PREDEFINED_CONSTANTS.ZERO);
              return 1;

            /* F2XM1 */ case 0xf0:
              regs.setNthValue(0x0, 2 ** regs.st0 - 1);
              return 1;
            /* FYL2X */ case 0xf1:
              regs.setNthValue(0x1, regs.st1 * Math.log2(regs.st0));
              regs.safePop();
              return 1;

            /* FPTAN */ case 0xf2:
              regs.setNthValue(0x0, Math.tan(regs.st0));
              regs.safePush(1.0);
              return 1;

            /* FPATAN */ case 0xf3:
              regs.setNthValue(0x1, Math.atan(this.fdiv(regs.st1, regs.st0)));
              regs.safePop();
              return 1;

            /* FXTRACT */ case 0xf4:
              {
                const { exponent, mantissa } = X87.numberParts(regs.st0);

                regs.setNthValue(0x0, exponent);
                regs.safePush(mantissa);
              }
              return 1;

            /* FPREM1 */ case 0xf5:
              regs.setNthValue(0x0, regs.st0 % regs.st1);
              return 1;
            /* FDECSTP */ case 0xf6:
              regs.setStackPointer(regs.stackPointer - 0x1);
              return 1;
            /* FINCSTP */ case 0xf7:
              regs.setStackPointer(regs.stackPointer + 0x1);
              return 1;
            /* FPREM */ case 0xf8:
              {
                const [st0, st1] = [regs.st0, regs.st1];
                const quotient = Math.trunc(st0 / st1);

                regs.setNthValue(0x0, st0 % st1);
                regs.c2 = false;

                if (quotient & 1) {
                  regs.c1 = true;
                }
                if (quotient & (1 << 1)) {
                  regs.c3 = true;
                }
                if (quotient & (1 << 2)) {
                  regs.c0 = true;
                }
              }
              return 1;

            /* FYL2XP1 */ case 0xf9:
              regs.setNthValue(0x1, regs.st1 * Math.log2(regs.st0 + 1));
              regs.safePop();
              return 1;

            /* FSINCOS */ case 0xfb:
              {
                const rad = regs.st0;

                regs.setNthValue(0x0, Math.sin(rad));
                regs.safePush(Math.cos(rad));
              }
              return 1;

            /* FSQRT */ case 0xfa:
              regs.setNthValue(0x0, Math.sqrt(regs.st0));
              return 1;
            /* FRND */ case 0xfc:
              regs.setNthValue(0x0, Math.round(regs.st0));
              return 1;
            /* FSCALE */ case 0xfd:
              regs.setNthValue(0x0, regs.st0 * 0x2 ** X87.truncate(regs.st1));
              return 1;
            /* FSIN */ case 0xfe:
              regs.setNthValue(0x0, Math.sin(regs.st0));
              return 1;
            /* FCOS */ case 0xff:
              regs.setNthValue(0x0, Math.cos(regs.st0));
              return 1;

            default:
          }

          /* FLD st(i), C0+i */
          if (byte >= 0xc0 && byte <= 0xc7) {
            regs.safePush(regs[byte - 0xc0]);
            return 1;
          }

          /* FXCH st(i), C8+i */
          if (byte >= 0xc8 && byte <= 0xcf) {
            const cached = regs.st0;
            const destIndex = byte - 0xc8;

            regs.setNthValue(0, regs.nth(destIndex));
            regs.setNthValue(destIndex, cached);
            return 1;
          }

          return 0;
        },

        /* FLD mdr(32) D9 /0 d0 d1  */ 0x0: address => {
          regs.safePush(ieee754Mem.read.single(address));
        },
        /* FST mdr(32) D9 /2 d0 d1 */ 0x2: address => {
          ieee754Mem.write.single(regs.st0, address);
        },
        /* FSTP mdr(32) D9 /3 d0 d1 */ 0x3: address => {
          ieee754Mem.write.single(regs.safePop(), address);
        },
        /* FLDENV m14/28byte */ 0x4: address => {
          this.fldenv(address);
        },
        /* FLDCW mw */ 0x5: address => {
          regs.control = memIO.read[0x2](address);
        },
        /* FSTENV m14/28byte */ 0x6: address => {
          this.fstenv(address);
        },
        /* FNSTCW m2byte */ 0x7: address => {
          memIO.write[0x2](regs.control, address);
        },
      }),

      0xdb: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch(byte) {
          switch (byte) {
            /* FNCLEX */ case 0xe2:
              regs.status &= 0b0111111100000000;
              return 1;

            /* FNENI */ case 0xe0:
            /* FDISI */ case 0xe1:
            /* FNINIT */ case 0xe3:
            /* FSETPM */ case 0xe4:
              return 1;

            default:
              return 0;
          }
        },

        /* FILD mdr(32) DB /0 d0 d1 */ 0x0: address => {
          regs.safePush(getSignedNumber(memIO.read[0x4](address), 0x4));
        },

        /* FIST m32int */ 0x2: address => this.fist(0x4, address),
        /* FIST m32int */ 0x3: address => {
          this.fist(0x4, address);
          regs.safePop();
        },
        /* FLD mtr(80) DB /5 d0 d1 */ 0x5: address => {
          regs.safePush(ieee754Mem.read.extended(address));
        },
        /* FSTP mtr(80) DB /7 d0 d1 */ 0x7: address => {
          ieee754Mem.write.extended(regs.safePop(), address);
        },
      }),

      0xda: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          /* FUCOMPP */ if (byte === 0xe9) {
            this.fucom(regs.st0, regs.st1);
            regs.safePop(); // pops twice
            regs.safePop();
          }

          return 0;
        },

        /* FIADD mdr(32) DA /0 */ 0x0: address => {
          regs.setNthValue(
            0,
            this.fadd(memIO.readSignedInt(address, 0x4), regs.st0),
          );
        },

        /* FIMUL mdr(32) DA /1 */ 0x1: address => {
          regs.setNthValue(
            0,
            this.fmul(memIO.readSignedInt(address, 0x4), regs.st0),
          );
        },

        /* FICOM DA /2 m32int */ 0x2: address => {
          this.fcom(regs.st0, memIO.readSignedInt(address, 0x4));
        },

        /* FICOMP DA /3 m32int */ 0x3: address => {
          this.fcom(regs.st0, memIO.readSignedInt(address, 0x4));
          regs.safePop();
        },

        /* FISUB mdr(32) DA /4 */ 0x4: address => {
          regs.setNthValue(
            0,
            this.fsub(regs.st0, memIO.readSignedInt(address, 0x4)),
          );
        },

        /* FISUBR mdr(32) DA /5 */ 0x5: address => {
          regs.setNthValue(
            0,
            this.fsub(memIO.readSignedInt(address, 0x4), regs.st0),
          );
        },

        /* FIDIV mdr(32) DA /6 */ 0x6: address => {
          regs.setNthValue(
            0,
            this.fdiv(regs.st0, memIO.readSignedInt(address, 0x4)),
          );
        },

        /* FIDIVR mdr(32) DA /7 */ 0x7: address => {
          regs.setNthValue(
            0,
            this.fdiv(memIO.readSignedInt(address, 0x4), regs.st0),
          );
        },
      }),

      0xdc: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          /* FADD ST(i), ST(0) DC C0+i */
          if (byte >= 0xc0 && byte <= 0xc7) {
            const registerIndex = byte - 0xc0;
            regs.setNthValue(
              registerIndex,
              this.fadd(regs.nth(registerIndex), regs.st0),
            );
            return 1;
          }

          /* FMUL ST(i), ST(0) DC C8+i */
          if (byte >= 0xc8 && byte <= 0xcf) {
            const registerIndex = byte - 0xc8;
            regs.setNthValue(
              registerIndex,
              this.fmul(regs.nth(registerIndex), regs.st0),
            );
            return 1;
          }

          /* FSUBR ST(i), ST(0) DC E8+i */
          if (byte >= 0xe0 && byte <= 0xe7) {
            const registerIndex = byte - 0xe0;
            regs.setNthValue(
              registerIndex,
              this.fsub(regs.st0, regs.nth(registerIndex)),
            );
            return 1;
          }

          /* FSUB ST(i), ST(0) DC E8+i */
          if (byte >= 0xe8 && byte <= 0xef) {
            const registerIndex = byte - 0xe8;
            regs.setNthValue(
              registerIndex,
              this.fsub(regs.nth(registerIndex), regs.st0),
            );
            return 1;
          }

          /* FDIVR ST(i), ST(0) DC F0+i */
          if (byte >= 0xf0 && byte <= 0xf7) {
            const registerIndex = byte - 0xf0;
            regs.setNthValue(
              registerIndex,
              this.fdiv(regs.st0, regs.nth(registerIndex)),
            );
            return 1;
          }

          /* FDIV ST(i), ST(0) DC F8+i */
          if (byte >= 0xf8 && byte <= 0xff) {
            const registerIndex = byte - 0xf8;
            regs.setNthValue(
              registerIndex,
              this.fdiv(regs.nth(registerIndex), regs.st0),
            );
            return 1;
          }

          return 0;
        },

        /* FADD mqr(64) */ 0x0: address => {
          regs.setNthValue(
            0x0,
            this.fadd(regs.st0, ieee754Mem.read.double(address)),
          );
        },
        /* FMUL mqr(64) */ 0x1: address => {
          regs.setNthValue(
            0x0,
            this.fmul(regs.st0, ieee754Mem.read.double(address)),
          );
        },
        /* FCOM mqr(64) */ 0x2: address => {
          this.fcom(regs.st0, ieee754Mem.read.double(address));
        },
        /* FCOMP mqr(64) */ 0x3: address => {
          this.fcom(regs.st0, ieee754Mem.read.double(address));
          regs.safePop();
        },

        /* FSUB mqr(64) */ 0x4: address => {
          regs.setNthValue(
            0x0,
            this.fsub(regs.st0, ieee754Mem.read.double(address)),
          );
        },
        /* FSUB mqr(64) */ 0x5: address => {
          regs.setNthValue(
            0x0,
            this.fsub(ieee754Mem.read.double(address), regs.st0),
          );
        },
        /* FDIV mqr(64) */ 0x6: address => {
          regs.setNthValue(
            0x0,
            this.fdiv(regs.st0, ieee754Mem.read.double(address)),
          );
        },
        /* FDIVR mqr(64) */ 0x7: address => {
          regs.setNthValue(
            0x0,
            this.fdiv(ieee754Mem.read.double(address), regs.st0),
          );
        },
      }),

      0xdd: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          /* FUCOM ST(i) */ if (byte >= 0xe0 && byte <= 0xe7) {
            this.fucom(regs.st0, regs.nth(byte - 0xe0));
            return 1;
          }

          /* FUCOMP ST(i) */ if (byte >= 0xe8 && byte <= 0xef) {
            this.fucom(regs.st0, regs.nth(byte - 0xe8));
            regs.safePop();
            return 1;
          }

          /* FFREE st(i) DD C0+i */
          if (byte >= 0xc0 && byte <= 0xc7) {
            regs.setNthTag(
              regs.stackPointerIndexToRegIndex(byte - 0xc0),
              X87Tag.EMPTY,
            );

            return 1;
          }

          /* FST st(i) DD D0+i */
          if (byte >= 0xd0 && byte <= 0xd7) {
            regs.setNthValue(byte - 0xd0, regs.st0);
            return 1;
          }

          /* FSTP st(i) DD D8+i */
          if (byte >= 0xd8 && byte <= 0xdf) {
            regs.setNthValue(byte - 0xd8, regs.st0);
            regs.safePop();
            return 1;
          }

          return 0;
        },

        /* FLD mqr(64) DD /0 d0 d1 */ 0x0: address => {
          regs.safePush(ieee754Mem.read.double(address));
        },
        /* FST mqr(64) DD /2 d0 d1 */ 0x2: address => {
          ieee754Mem.write.double(regs.st0, address);
        },
        /* FSTP mqr(64) DD /3 d0 d1 */ 0x3: address => {
          ieee754Mem.write.double(regs.safePop(), address);
        },
        /* FRSTR m94 */ 0x4: address => {
          this.frstor(address);
        },
        /* FSAVE m94 */ 0x6: address => {
          this.fsave(address);
        },
        /* FNSTSW m2byte */ 0x7: address => {
          memIO.write[0x2](regs.status, address);
        },
      }),

      0xde: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch: byte => {
          /* FCOMPP (pops twice) */
          if (byte === 0xd9) {
            this.fcom(regs.st0, regs.st1);
            regs.safePop();
            regs.safePop();
            return 1;
          }

          /* FADDP ST(i), ST(0) DE C8+i */
          if (byte >= 0xc0 && byte <= 0xc7) {
            const registerIndex = byte - 0xc0;

            regs.setNthValue(
              registerIndex,
              this.fadd(regs.nth(registerIndex), regs.st0),
            );
            regs.safePop();
            return 1;
          }

          /* FMULP ST(i), ST(0) DE C8+i */
          if (byte >= 0xc8 && byte <= 0xcf) {
            const registerIndex = byte - 0xc8;

            regs.setNthValue(
              registerIndex,
              this.fmul(regs.nth(registerIndex), regs.st0),
            );
            regs.safePop();
            return 1;
          }

          /* FSUBRP ST(i), ST(0) DE E0+i */
          if (byte >= 0xe0 && byte <= 0xe7) {
            const registerIndex = byte - 0xe0;

            regs.setNthValue(
              registerIndex,
              this.fsub(regs.st0, regs.nth(registerIndex)),
            );
            regs.safePop();
            return 1;
          }

          /* FSUBP ST(i), ST(0) DE E8+i */
          if (byte >= 0xe8 && byte <= 0xef) {
            const registerIndex = byte - 0xe8;

            regs.setNthValue(
              registerIndex,
              this.fsub(regs.nth(registerIndex), regs.st0),
            );
            regs.safePop();
            return 1;
          }

          /* FDIVRP ST(i), ST(0) DE F0+i */
          if (byte >= 0xf0 && byte <= 0xf7) {
            const registerIndex = byte - 0xf0;

            regs.setNthValue(
              registerIndex,
              this.fdiv(regs.st0, regs.nth(registerIndex)),
            );
            regs.safePop();
            return 1;
          }

          /* FDIVP ST(i), ST(0) DE F8+i */
          if (byte >= 0xf8 && byte <= 0xff) {
            const registerIndex = byte - 0xf8;

            regs.setNthValue(
              registerIndex,
              this.fdiv(regs.nth(registerIndex), regs.st0),
            );
            regs.safePop();
            return 1;
          }

          return 0;
        },

        /* FIADD mw(16) DE /0 */ 0x0: address => {
          regs.setNthValue(
            0,
            this.fadd(regs.st0, memIO.readSignedInt(address, 0x2)),
          );
        },

        /* FIMUL mw(16) DE /1 */ 0x1: address => {
          regs.setNthValue(
            0,
            this.fmul(regs.st0, memIO.readSignedInt(address, 0x2)),
          );
        },

        /* FICOM m16int DE /2 */ 0x2: address => {
          this.fcom(regs.st0, memIO.readSignedInt(address, 0x2));
        },

        /* FICOMP m16int DE /3 */ 0x3: address => {
          this.fcom(regs.st0, memIO.readSignedInt(address, 0x2));
          regs.safePop();
        },

        /* FISUB mw(16) DE /4 */ 0x4: address => {
          regs.setNthValue(
            0,
            this.fsub(regs.st0, memIO.readSignedInt(address, 0x2)),
          );
        },

        /* FISUBR mw(16) DE /5 */ 0x5: address => {
          regs.setNthValue(
            0,
            this.fsub(memIO.readSignedInt(address, 0x2), regs.st0),
          );
        },

        /* FDIV mw(16) DE /6 */ 0x6: address => {
          regs.setNthValue(
            0,
            this.fdiv(regs.st0, memIO.readSignedInt(address, 0x2)),
          );
        },

        /* FDIVR mw(16) DE /7 */ 0x7: address => {
          regs.setNthValue(
            0,
            this.fdiv(memIO.readSignedInt(address, 0x2), regs.st0),
          );
        },
      }),

      0xdf: X86InstructionSet.switchRMOpcodeInstruction(cpu, null, {
        nonRMMatch(byte) {
          /* FNSTSW ax */ if (byte === 0xe0) {
            cpu.registers.ax = regs.status;
            return 1;
          }

          return 0;
        },

        /* FILD m16int */ 0x0: address => {
          regs.safePush(getSignedNumber(memIO.read[0x2](address), 0x2));
        },

        /* FIST m16int */ 0x2: address => this.fist(0x2, address),
        /* FISTP m16int */ 0x3: address => {
          this.fist(0x2, address);
          regs.safePop();
        },

        /* FILD m64int */ 0x5: address => {
          const [low, high] = memIO.read[0x8](address);
          regs.safePush(new Long(low, high).toNumber());
        },

        /* FISTP m64int */ 0x7: address => {
          this.fist(0x8, address);
          regs.safePop();
        },
      }),
    });
  }
}
