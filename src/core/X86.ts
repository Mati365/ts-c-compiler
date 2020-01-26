import * as R from 'ramda';

import {
  X86_FLAGS,
  X86_REGISTERS,
} from './constants';

import {setBit} from './utils/bits';
import Logger from './Logger';

const opcodesTable = {};

type CPUConfig = {
  ignoreMagic?: boolean,
  debugger?: boolean,
};

/**
 * Main code exec
 * @class CPU
 */
export default class CPU {
  /** Only for speedup calc */
  static bitMask = {
    0x1: (0x2 << 0x7) - 0x1,
    0x2: (0x2 << 0xF) - 0x1,
    0x4: (0x2 << 0x1F) - 0x1,
  };

  /** CPU exceptions */
  static Exception = {
    MEM_DUMP: 0x0,
    DIV_BY_ZERO: 0x1,
  };

  private logger = new Logger;

  private pause = false;

  private config = {
    ignoreMagic: true,
    debugger: false,
  };

  private devices: {[uuid: string]: Device} = {};

  /**
   * Creates an instance of CPU
   *
   * @param {Config}  CPU config
   */
  constructor(config?: CPUConfig) {
    if (config)
      Object.assign(this.config, config);

    /** Devices list */
    this.interrupts = {};
    this.ports = {};

    /**
     * Alloc 1024 KB of RAM memory
     * todo: Implement A20 line support
     */
    this.mem = Buffer.alloc(1114112);
    this.memIO = {
      device: this.mem,
      read: {
        /** 8bit  */ 0x1: ::this.mem.readUInt8,
        /** 16bit */ 0x2: ::this.mem.readUInt16LE,
        /** 32bit */ 0x4: ::this.mem.readUInt32LE,
      },
      write: {
        /** 8bit  */ 0x1: ::this.mem.writeUInt8,
        /** 16bit */ 0x2: ::this.mem.writeUInt16LE,
        /** 32bit */ 0x4: ::this.mem.writeUInt16LE,
      },
    };

    this.registers = {
      /** Main registers */
      ax: 0x0, bx: 0x0, cx: 0x0, dx: 0x0,

      /** Index registers */
      si: 0x0, di: 0x0, bp: 0x0, sp: 0x0,

      /** Instruction counter */
      ip: 0x0,

      /** Segment registers */
      cs: 0x0, ds: 0x0, es: 0x0, ss: 0x0, fs: 0x0,

      /** Flags */
      flags: 0x0, status: {},
    };

    /**
     * Define opcodes prefixes
     * see: http://www.c-jump.com/CIS77/CPU/x86/X77_0240_prefix.htm
     */
    CPU.prefixes = {
      0xF0: 0x0, /** LOCK */
      0xF3: 0x0, /** REP  */
      0xF2: 0x1, /** REPNE */

      /** Segment override */
      0x2E: {_sr: 'cs'},
      0x36: {_sr: 'ss'},
      0x3E: {_sr: 'ds'},
      0x26: {_sr: 'es'},
      0x64: {_sr: 'fs'},
      0x65: {_sr: 'gs'},

      0x66: 0x2, /** Operrand override */
      0x67: 0x3, /** Adress override  */
    };

    CPU.prefixMap = {
      0x0: 'instruction',
      0x1: 'segment',
      0x2: 'operandSize',
      0x3: 'addressSize',
    };
    this.prefixes = {
      [CPU.prefixMap[0x0]]: null, /** Group 1: LOCK, REPE/REPZ, REP, REPNE/REPNZ         */
      [CPU.prefixMap[0x1]]: null, /** Group 2: CS, DS, ES, FS, GS, SS, Branch hints      */
      [CPU.prefixMap[0x2]]: null, /** Group 3: Operand-size override (16 bit vs. 32 bit) */
      [CPU.prefixMap[0x3]]: null, /** Group 4: Address-size override (16 bit vs. 32 bit) */
    };

    /** Define flags register helpers */
    CPU.flags = X86_FLAGS;
    R.forEachObjIndexed(
      (bit, flag) => {
        Object.defineProperty(
          this.registers.status, flag,
          {
            get: () => (this.registers.flags >> bit) & 0x1,
            set: (val) => {
              this.registers.flags ^= (-(val ? 1 : 0) ^ this.registers.flags) & (1 << bit);
            },
          },
        );
      },
      CPU.flags,
    );

    /**
     * Separate registers, emulate C++ unions
     * numbers representation
     * Bits:
     * high     low
     * 00000000 00000000
     * todo: Optimize set() methods
     */
    const defineRegisterAccessors = (reg, high, low) => {
      Object.defineProperty(this.registers, low, {
        get: () => this.registers[reg] & 0xFF,
        set: (val) => {
          this.registers[reg] = (this.registers[reg] & 0xFF00) | (val & 0xFF);
        },
      });

      Object.defineProperty(this.registers, high, {
        get: () => (this.registers[reg] >> 0x8) & 0xFF,
        set: (val) => {
          this.registers[reg] = (this.registers[reg] & 0xFF) | ((val & 0xFF) << 8);
        },
      });
    };

    R.forEach(
      R.apply(defineRegisterAccessors),
      [
        ['ax', 'ah', 'al'],
        ['bx', 'bh', 'bl'],
        ['cx', 'ch', 'cl'],
        ['dx', 'dh', 'dl'],
      ],
    );

    /** Map register codes */
    this.regMap = X86_REGISTERS;

    /** Generate instructions */
    this.initOpcodeSet();
  }

  /**
   * For faster exec generates CPU specific opcodes list
   * see:
   * http://csiflabs.cs.ucdavis.edu/~ssdavis/50/8086%20Opcodes.pdf
   * https://en.wikipedia.org/wiki/X86_instruction_listings#Original_8086.2F8088_instructions
   */
  initOpcodeSet() {
    /** Operators binded to the same opcode, its changed using byte.rm */
    const switchOpcode = (bits, operators) => {
      const operatorExecutor = (val, byte) => {
        const operator = operators[byte.reg] || operators.default;
        if (operator)
          return operator(val, byte);

        throw new Error(`Unsupported operator! ${byte.reg}`);
      };

      this.parseRmByte(
        (reg, _, byte) => {
          this.registers[reg] = operatorExecutor(this.registers[reg], byte);
        },
        (address, _, byte) => {
          this.memIO.write[bits](
            operatorExecutor(this.memIO.read[bits](address), byte),
            address,
          );
        },
        bits,
      );
    };

    this.opcodes = {
      /** MOV r/m8, reg8 */ 0x88: (bits = 0x1) => {
        this.parseRmByte(
          (reg, modeReg) => {
            this.registers[reg] = this.registers[this.regMap[bits][modeReg]];
          },
          (address, src) => {
            this.memIO.write[bits](this.registers[src], address);
          },
          bits,
        );
      },
      /** MOV r/m16, sreg */ 0x8C: () => {
        this.parseRmByte(
          (reg, modeReg) => {
            this.registers[reg] = this.registers[this.regMap.sreg[modeReg]];
          },
          (address, _, byte) => {
            this.memIO.write[0x2](this.registers[this.regMap.sreg[byte.reg]], address);
          },
          0x2,
        );
      },
      /** MOV sreg, r/m16 */ 0x8E: () => {
        this.parseRmByte(
          (reg, modeReg) => {
            this.registers[this.regMap.sreg[modeReg]] = this.registers[reg];
          },
          (address, _, byte) => {
            this.registers[this.regMap.sreg[byte.reg]] = this.memIO.read[0x2](address);
          },
          0x2,
        );
      },
      /** MOV r8, r/m8    */ 0x8A: (bits = 0x1) => {
        this.parseRmByte(
          (reg, modeReg) => {
            this.registers[this.regMap[bits][modeReg]] = this.registers[reg];
          },
          (address, reg) => {
            this.registers[reg] = this.memIO.read[bits](address);
          },
          bits,
        );
      },

      /** MOV al, m16  */ 0xA0: (bits = 0x1) => {
        this.registers[this.regMap[bits][0]] = this.memIO.read[bits](
          this.getMemAddress(this.segmentReg, this.fetchOpcode(0x2)),
        );
      },
      /** MOV ax, m16 */ 0xA1: () => this.opcodes[0xA0](0x2),

      /** MOV m8, al  */ 0xA2: (bits = 0x1) => {
        this.memIO.write[bits](
          this.registers[this.regMap[bits][0x0]],
          this.getMemAddress(this.segmentReg, this.fetchOpcode(0x2)),
        );
      },
      /** MOV m16, ax */ 0xA3: () => this.opcodes[0xA2](0x2),

      /** MOV r/m8, imm8  */ 0xC6: (bits = 0x1) => {
        this.parseRmByte(
          () => { /** todo */ throw new Error('0xC6: Fix me!'); },
          (address) => {
            this.memIO.write[bits](this.fetchOpcode(bits), address);
          },
          bits,
        );
      },
      /** MOV r/m16, reg16  */ 0x89: () => this.opcodes[0x88](0x2),
      /** MOV r16, r/m16    */ 0x8B: () => this.opcodes[0x8A](0x2),
      /** MOV r/m16, imm16  */ 0xC7: () => this.opcodes[0xC6](0x2),

      /** PUSH/INC/DEC reg8 */ 0xFE: (bits = 0x1) => {
        this.parseRmByte(
          (_, modeReg, mode) => {
            const reg = this.regMap[bits][mode.rm];
            if (mode.reg === 0x6)
              this.push(this.registers[reg]);
            else {
              this.registers[reg] = this.alu(
                this.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
                this.registers[reg],
                null, bits,
              );
            }
          },
          (address, reg, mode) => {
            const memVal = this.memIO.read[bits](address);
            if (mode.reg === 0x6)
              this.push(memVal);
            else {
              this.memIO.write[bits](
                this.alu(
                  this.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
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
      /** INC/DEC reg16 */ 0xFF: () => this.opcodes[0xFE](0x2),

      /** PUSHA */ 0x60: () => {
        const temp = this.registers.sp;
        for (let i = 0; i <= 0x7; ++i) {
          this.push(
            i === 0x4 ? temp : this.registers[this.regMap[0x2][i]],
          );
        }
      },
      /** POPA  */ 0x61: () => {
        /** Skip SP */
        for (let i = 0x7; i >= 0; --i) {
          const val = this.pop();
          if (i !== 0x4)
            this.registers[this.regMap[0x2][i]] = val;
        }
      },

      /** PUSH imm8     */ 0x6A: () => this.push(this.fetchOpcode(), 0x2),
      /** PUSH imm16    */ 0x68: () => this.push(this.fetchOpcode(0x2), 0x2),

      /** PUSHF         */ 0x9C: () => this.push(this.registers.flags),
      /** POPF          */ 0x9D: () => {
        this.registers.flags = this.pop();
      },

      /** LOOPNE        */ 0xE0: () => {
        const relativeAddress = this.fetchOpcode();
        if (--this.registers.cx && !this.registers.status.zf)
          this.relativeJump(0x1, relativeAddress);
      },
      /** LOOP 8bit rel */ 0xE2: () => {
        const relativeAddress = this.fetchOpcode();
        if (--this.registers.cx)
          this.relativeJump(0x1, relativeAddress);
      },

      /** IRET 48b  */ 0xCF: () => {
        Object.assign(this.registers, {
          ip: this.pop(),
          cs: this.pop(),
          flags: this.pop(),
        });
      },

      /** RET far   */ 0xCB: () => {
        this.registers.ip = this.pop();
        this.registers.cs = this.pop();
      },
      /** RET near  */ 0xC3: (bits = 0x2) => {
        this.registers.ip = this.pop(bits);
      },
      /** RET 16b   */ 0xC2: (bits = 0x2) => {
        const items = this.fetchOpcode(bits, false);
        this.registers.ip = this.pop();

        this.pop(items, false);
      },

      /** CALL 16bit/32bit dis  */ 0xE8: () => {
        this.push(this.registers.ip + 0x2);
        this.relativeJump(0x2);
      },

      /** JMP rel 8bit  */ 0xEB: () => this.relativeJump(0x1),
      /** JMP rel 16bit */ 0xE9: () => this.relativeJump(0x2),
      /** FAR JMP 32bit */ 0xEA: () => {
        Object.assign(this.registers, {
          ip: this.fetchOpcode(0x2),
          cs: this.fetchOpcode(0x2),
        });
      },

      /** STOSB */ 0xAA: (bits = 0x1) => {
        this.memIO.write[bits](
          this.registers[this.regMap[bits][0]],
          this.getMemAddress('es', 'di'),
        );
        this.dfIncrement(bits, 'di');
      },
      /** STOSW */ 0xAB: () => this.opcodes[0xAA](0x2),

      /** CLI   */ 0xFA: () => { this.registers.status.if = 0x0; },
      /** STI   */ 0xFB: () => { this.registers.status.if = 0x1; },

      /** CLC   */ 0xF8: () => { this.registers.status.cf = 0x0; },
      /** STC   */ 0xF9: () => { this.registers.status.cf = 0x1; },

      /** CLD   */ 0xFC: () => { this.registers.status.df = 0x0; },
      /** STD   */ 0xFD: () => { this.registers.status.df = 0x1; },

      /** MOVSB */ 0xA4: (bits = 0x1) => {
        this.memIO.write[bits](
          this.memIO.read[bits](this.getMemAddress('ds', 'si')),
          this.getMemAddress('es', 'di'),
        );

        /** Increment indexes */
        this.dfIncrement(bits, 'si', 'di');
      },
      /** MOVSW */ 0xA5: () => this.opcodes[0xA4](0x2),

      /** LODSB */ 0xAC: (bits = 0x1) => {
        this.registers[this.regMap[bits][0x0]] = this.memIO.read[bits](this.getMemAddress('ds', 'si'));
        this.dfIncrement(bits, 'si');
      },
      /** LODSW */ 0xAD: () => this.opcodes[0xAC](0x2),

      /** LDS r16, m16:16 */ 0xC5: (segment = 'ds') => {
        const reg = CPU.decodeRmByte(this.fetchOpcode()).reg,
          addr = CPU.getSegmentedAddress(this.fetchOpcode(0x2, false));

        this.regMap[0x2][reg] = addr.offset;
        this.registers[segment] = addr.segment;
      },
      /** LES r16, m16:16 */ 0xC4: () => this.opcodes[0xC5]('es'),
      /** LEA r16, mem    */ 0x8D: () => {
        this.parseRmByte(null, (address, reg) => { this.registers[reg] = address; }, 0x2, null);
      },

      /** INT imm8    */ 0xCD: () => {
        const code = this.fetchOpcode(),
          interrupt = this.interrupts[code];

        if (!interrupt)
          this.halt(`unknown interrupt 0x${code.toString(16)}`);
        else
          interrupt();
      },

      /** RCL r/m8,  cl */ 0xD2: (bits = 0x1, dir = 0x1) => {
        this.parseRmByte(
          (reg) => {
            this.registers[reg] = this.rotl(this.registers[reg], this.registers.cl * dir, bits);
          },
          (address) => {
            this.memIO.write[bits](
              this.rotl(this.memIO.read[bits](address), this.registers.cl * dir, bits),
              address,
            );
          },
          bits,
        );
      },
      /** RCL r/m16, cl */ 0xD3: () => this.opcodes[0xD2](0x2),

      /** ROL/SHR/SHL   */ 0xD0: (bits = 0x1) => {
        switchOpcode(bits, {
          /** ROL */ 0x0: val => this.rotate(val, -0x1, bits),
          /** ROR */ 0x1: val => this.rotate(val, 0x1, bits),
          /** SHL */ 0x4: val => this.shl(val, 0x1, bits),
          /** SHR */ 0x5: val => this.shr(val, 0x1, bits),
        });
      },

      /** TODO: check if works */
      /** ROL/SHR/SHL r/m8  */ 0xC0: () => {
        switchOpcode(0x1, {
          /** SHL IMM8 */ 0x4: val => this.shl(val, this.fetchOpcode(), 0x1),
          /** SHR IMM8 */ 0x5: val => this.shr(val, this.fetchOpcode(), 0x1),
        });
      },

      /** ROL/SHR/SHL r/m16 */ 0xC1: () => {
        switchOpcode(0x2, {
          /** SHL IMM8 */ 0x4: val => this.shl(val, this.fetchOpcode(), 0x2),
          /** SHR IMM8 */ 0x5: val => this.shr(val, this.fetchOpcode(), 0x2),
        });
      },

      /** ROR r/m8, 1   */ 0xD1: () => this.opcodes[0xD0](0x2),

      /** CBW */ 0x98: () => {
        this.registers.ah = (this.registers.al & 0x80) === 0x80 ? 0xFF : 0x0;
      },
      /** CWD */ 0x99: () => {
        this.registers.ax = (this.registers.ax & 0x8000) === 0x8000 ? 0xFFFF : 0x0;
      },

      /** SALC */ 0xD6: () => {
        this.registers.al = this.registers.status.cf ? 0xFF : 0x0;
      },

      /** XCHG bx, bx */ 0x87: () => {
        const arg = this.fetchOpcode(0x1, false, true);

        switch (arg) {
          case 0xDB:
          case 0xD2:
            this.registers.ip++;

            this.raiseException(CPU.Exception.MEM_DUMP);
            this.dumpRegisters();

            if (arg === 0xDB)
              debugger; // eslint-disable-line no-debugger
            break;

          default:
            this.parseRmByte(
              (reg, reg2) => {
                [
                  this.registers[this.regMap[0x2][reg2]],
                  this.registers[reg],
                ] = [
                  this.registers[reg],
                  this.registers[this.regMap[0x2][reg2]],
                ];
              },
              () => { throw new Error('todo: xchg in mem address'); },
              0x2,
            );
        }
      },

      /** HLT */ 0xF4: this.halt.bind(this),

      /** ICE BreakPoint */ 0xF1: () => {},
      /** NOP */ 0x90: () => {},
    };

    /** General usage registers opcodes */
    for (let opcode = 0; opcode < Object.keys(this.regMap[0x1]).length; ++opcode) {
      /** MOV register opcodes */
      ((_opcode) => {
        const _r8 = this.regMap[0x1][_opcode],
          _r16 = this.regMap[0x2][_opcode];

        /** XCHG AX, r16 */ this.opcodes[0x90 + _opcode] = () => {
          const dest = this.regMap[0x2][_opcode],
            temp = this.registers[dest];

          this.registers[dest] = this.registers.ax;
          this.registers.ax = temp;
        };

        /** MOV reg8, imm8 $B0 + reg8 code */
        this.opcodes[0xB0 + _opcode] = () => { this.registers[_r8] = this.fetchOpcode(); };

        /** MOV reg16, imm16 $B8 + reg16 code */
        this.opcodes[0xB8 + _opcode] = () => { this.registers[_r16] = this.fetchOpcode(0x2); };

        /** INC reg16 */
        this.opcodes[0x40 + _opcode] = () => {
          this.registers[_r16] = this.alu(this.operators.extra.increment, this.registers[_r16], null, 0x2);
        };

        /** DEC reg16 */
        this.opcodes[0x48 + _opcode] = () => {
          this.registers[_r16] = this.alu(this.operators.extra.decrement, this.registers[_r16], null, 0x2);
        };

        /** PUSH reg16 */
        this.opcodes[0x50 + _opcode] = () => this.push(this.registers[_r16]);

        /** POP reg16 */
        this.opcodes[0x58 + _opcode] = () => { this.registers[_r16] = this.pop(); };
      })(opcode);
    }

    /** 8 bit jump instructions set */
    const jmpOpcodes = {
      /** JO  */ 0x70: f => f.of,
      /** JNO */ 0x71: f => !f.of,
      /** JB  */ 0x72: f => f.cf,
      /** JAE */ 0x73: f => !f.cf,
      /** JZ  */ 0x74: f => f.zf,
      /** JNE */ 0x75: f => !f.zf,
      /** JBE */ 0x76: f => f.cf || f.zf,
      /** JA  */ 0x77: f => !f.cf && !f.zf,
      /** JS  */ 0x78: f => f.sf,
      /** JNS */ 0x79: f => !f.sf,
      /** JP  */ 0x7A: f => f.pf,
      /** JNP */ 0x7B: f => !f.pf,
      /** JG  */ 0x7F: f => !f.zf && f.sf === f.of,
      /** JGE */ 0x7D: f => f.sf === f.of,
      /** JL  */ 0x7C: f => f.sf !== f.of, // todo: broken rsi: 00000000_000eb3e2 rdi: 00000000_00009001 does not trigger flag
      /** JLE */ 0x7E: f => f.zf || f.sf !== f.of,
    };

    const jumpIf = (flagCondition, bits = 0x1) => {
      const relative = this.fetchOpcode(bits);
      flagCondition(this.registers.status) && this.relativeJump(bits, relative);
    };

    R.forEachObjIndexed(
      (jmpFn, opcode) => {
        this.opcodes[opcode] = () => jumpIf(jmpFn);
        this.opcodes[(0x0F << 0x8) | (+opcode + 0x10)] = () => jumpIf(jmpFn, 0x2);
      },
      jmpOpcodes,
    );

    /** Create stack */
    this.initStack();

    /**
     * Generate algebra offset calls
     * todo: implement FPU
     */
    this.initALU();
    this.initIO();
  }

  /** Initialize IN/OUT opcodes set */
  initIO() {
    Object.assign(this.opcodes, {
      /** IN AL, 8bits  */ 0xE4: (bits = 0x1, port) => {
        if (!port)
          port = this.fetchOpcode(0x1);

        const portHandler = this.ports[port];
        this.registers[this.regMap[bits][0x0]] = portHandler ? portHandler.get(bits) : 0;
      },
      /** IN AX, 16bits */ 0xE5: () => this.opcodes[0xE4](0x2),

      /** IN AL, port[DX] */ 0xEC: () => this.opcodes[0xE4](0x1, this.registers.dx),
      /** IN AL, port[DX] */ 0xED: () => this.opcodes[0xE4](0x2, this.registers.dx),

      /** OUT 8bits, al  */ 0xE6: (bits = 0x1, port) => {
        port = port || this.fetchOpcode(0x1);
        if (port in this.ports)
          this.ports[port].set(this.registers[this.regMap[bits][0x0]], bits);
      },
      /** OUT 8bits, al     */ 0xE7: () => this.opcodes[0xE6](0x2),
      /** OUT port[DX], al  */ 0xEE: () => this.opcodes[0xE6](0x1, this.registers.dx),
      /** OUT port[DX], ah  */ 0xEF: () => this.opcodes[0xE6](0x2, this.registers.dx),
    });
  }

  /**
   * Slow as fuck ALU initializer
   * todo: Make it fast
   */
  initALU() {
    for (const key in this.operators) {
      if (key === 'extra')
        continue;

      ((op) => {
        const offset = op.offset;
        const codes = {
          /** OPERATOR r/m8, r8 */ [0x0 + offset]: (bits = 0x1) => {
            this.parseRmByte(
              (reg, modeReg) => {
                this.registers[reg] = this.alu(op, this.registers[reg], this.registers[this.regMap[bits][modeReg]], bits);
              },
              (address, reg) => {
                this.memIO.write[bits](
                  this.alu(op, this.memIO.read[bits](address), this.registers[reg], bits),
                  address,
                );
              }, bits,
            );
          },
          /** OPERATOR m8, r/m8 */ [0x2 + offset]: (bits = 0x1) => {
            this.parseRmByte(
              (reg, modeReg) => {
                const dest = this.regMap[bits][modeReg];
                this.registers[dest] = this.alu(op, this.registers[reg], this.registers[dest], bits);
              },
              (address, reg) => {
                this.registers[reg] = this.alu(op, this.registers[reg], this.memIO.read[bits](address), bits);
              }, bits,
            );
          },
          /** OPERATOR AL, imm8 */ [0x4 + offset]: (bits = 0x1) => {
            this.registers[this.regMap[bits][0]] = this.alu(op, this.registers[this.regMap[bits][0]], this.fetchOpcode(bits), bits);
          },

          /** OPERATOR AX, imm16  */ [0x5 + offset]: () => this.opcodes[0x4 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x1 + offset]: () => this.opcodes[0x0 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x3 + offset]: () => this.opcodes[0x2 + offset](0x2),
        };
        Object.assign(this.opcodes, codes);
      })(this.operators[key]);
    }
  }
}
