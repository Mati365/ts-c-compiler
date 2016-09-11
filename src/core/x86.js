'use strict';

const Table = require('cli-table');

/**
 * Simple logger
 * @class Logger
 */
class Logger {
  constructor() {
    (['error', 'info', 'warn']).forEach((scope) => {
      this[scope] = this.log.bind(this, scope);
    });
  }

  /**
   * Log message
   *
   * @param {String}  type  Message type
   * @param {String}  msg   Message content
   */
  log(type, msg) {
    console.log(`${type}: ${msg}`);
  }
}

/**
 * Main code exec
 * @class CPU
 */
class CPU {
  /**
   * Creates an instance of CPU
   *
   * @param {Config}  CPU config
   */
  constructor(config) {
    /** Debug logger */
    this.logger = new Logger;

    /** Default CPU config */
    this.config = {
      clockSpeed: 5,
      ignoreMagic: false
    }
    config && Object.assign(this.config, config);

    /** Devices list */
    this.interrupts = {};
    this.ports = {};

    /**
     * Alloc 1024 KB of RAM memory
     * todo: Implement A20 line support
     */
    this.mem = Buffer.alloc(8388608);
    this.memIO = {
      read: {
        /** 8bit  */  0x1: this.mem.readUInt8.bind(this.mem),
        /** 16bit */  0x2: this.mem.readUInt16LE.bind(this.mem),
        /** 32bit */  0x4: this.mem.readUInt32LE.bind(this.mem)
      },
      write: {
        /** 8bit  */  0x1: this.mem.writeUInt8.bind(this.mem),
        /** 16bit */  0x2: this.mem.writeUInt16LE.bind(this.mem),
        /** 32bit */  0x4: this.mem.writeUInt16LE.bind(this.mem)
      }
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
      flags: 0x0, status: {}
    };

    /**
     * Define opcodes prefixes
     * see: http://www.c-jump.com/CIS77/CPU/x86/X77_0240_prefix.htm
     */
    CPU.prefixes = {
      0xF0: true, /** LOCK */
      0xF3: true, /** REP  */
      0xF2: true, /** REPNE */

      /** Segment override */
      0x2E: { _sr: 'cs' },
      0x36: { _sr: 'ss' },
      0x3E: { _sr: 'ds' },
      0x26: { _sr: 'es' },
      0x64: { _sr: 'fs' },
      0x65: { _sr: 'gs' },

      0x66: true, /** Operrand override */
      0x67: true  /** Adress override  */
    };

    /** Define flags register helpers */
    CPU.flags = {
      'cf': 0x0,  /** Carry flag */
      'pf': 0x2,  /** Parity flag */
      'af': 0x4,  /** Auxiliary - Carry Flags */
      'zf': 0x6,  /** Zero flag */
      'sf': 0x7,  /** Signum flag */
      'tf': 0x8,  /** Trap flag */
      'if': 0x9,  /** Interrupt flag */
      'df': 0xA, /** Direction flag */
      'of': 0xB  /** Overflow flag */
    }
    for(let k in CPU.flags) {
      ((name, bit) => {
        Object.defineProperty(this.registers.status, name, {
          get: ()     => this.registers.flags & bit,
          set: (val)  => this.registers.flags ^= (-(val ? 1 : 0) ^ this.registers.flags) & (1 << bit)
        });
      })(k, CPU.flags[k]);
    }

    /**
     * Separate registers, emulate C++ unions
     * numbers representation
     * Bits:
     * high     low
     * 00000000 00000000
     * todo: Optimize set() methods
     */
    const separateRegister = (reg, high, low) => {
      Object.defineProperty(this.registers, low, {
        get: () => this.registers[reg] & 0xFF,
        set: (val) => this.registers[reg] = (this.registers[reg] & 0xFF00) | (val & 0xFF)
      });

      Object.defineProperty(this.registers, high, {
        get: () => (this.registers[reg] >> 0x8) & 0xFF,
        set: (val) => this.registers[reg] = (this.registers[reg] & 0xFF) | ((val & 0xFF) << 8)
      });
    };
    ([
      ['ax', 'ah', 'al'],
      ['bx', 'bh', 'bl'],
      ['cx', 'ch', 'cl'],
      ['dx', 'dh', 'dl']
    ]).forEach((args) => {
      separateRegister.apply(this, args);
    });

    /** Map register codes */
    this.regMap = {
      /** 8bit registers indexes */
      0x1: {
        0x0: 'al', 0x1: 'cl',
        0x2: 'dl', 0x3: 'bl',
        0x4: 'ah', 0x5: 'ch',
        0x6: 'dh', 0x7: 'bh'
      },

      /** 16bit register indexes */
      0x2: {
        0x0: 'ax', 0x1: 'cx',
        0x2: 'dx', 0x3: 'bx',
        0x4: 'sp', 0x5: 'bp',
        0x6: 'si', 0x7: 'di'
      },

      /** Segment registers */
      sreg: {
        0x0: 'es', 0x1: 'cs',
        0x2: 'ss', 0x3: 'ds'
      }
    };

    /** Generate instructions */
    this.initOpcodeSet();
  }

  /**
   * Attach device to CPU
   *
   * @param {Device} device Device class
   * @param {Array}  args   Array of params
   * @returns CPU
   */
  attach(Device, ...args) {
    new Device().attach(this, args);
    return this;
  }

  /** Last stack item address */
  get lastStackAddr() {
    return CPU.getMemAddress(this.registers.ss, this.registers.sp);
  }

  /**
   * Decrement stack pointer and push value to stack
   *
   * @param {Number}  val   Value to be stored on stack
   * @param {Number}  bits  Intel 8086 supports only 16bit stack
   */
  push(val, bits = 0x2) {
    this.registers.sp = CPU.toUnsignedNumber(this.registers.sp - bits, 0x2);
    this.memIO.write[bits](val, this.lastStackAddr);
  }

  /**
   * POP n-bytes from stack
   *
   * @param {Number}  bits  Bytes number
   * @param {Boolean} read  Read bytes or only pop
   * @returns
   */
  pop(bits = 0x2, read = true) {
    const val = read && this.memIO.read[bits](this.lastStackAddr);
    this.registers.sp = CPU.toUnsignedNumber(this.registers.sp + bits, 0x2);
    return val;
  }

  /**
   * Default stack segment address, after push()
   * values will be added at the end of mem
   *
   * @param {Number}  segment Stack segment index
   */
  initStack(segment = 0x0) {
    /** Set default stack environment */
    Object.assign(this.registers, {
      ss: segment,
      sp: 0x0
    });

    /**
     * Segment register push mapper
     * see: http://csiflabs.cs.ucdavis.edu/~ssdavis/50/8086%20Opcodes.pdf
     */
    const stackSregMap = {
      0x0:  'es',
      0x8:  'cs',
      0x10: 'ss',
      0x18: 'ds'
    };
    for (let sregIndex in stackSregMap) {
      ((index) => {
        /** PUSH sr16 */ this.opcodes[0x6 + index] = () => this.push(this.registers[stackSregMap[index]]);
        /** POP sr16  */ this.opcodes[0x7 + index] = () => this.registers[stackSregMap[index]] = this.pop();
      })(parseInt(sregIndex));
    }
  }

  /**
   * Boot device
   *
   * @param {File|string} device  Node file pointer
   * @param {Number}      id      Device ID loaded into DL register
   */
  boot(device, id = 0x0) {
    /** Convert HEX string to Node buffer */
    if(typeof device === 'string')
      device = new Buffer(device, 'hex');

    /** Remove logging if silent */
    if(this.config.silent)
      this.logger.log = function() {}

    /** Booting procedure */
    this.device = device;
    Object.assign(this.registers, {
      dl: id
    });

    this.logger.info('CPU: Intel 8086 compatible processor');
    this.loadMBR(this.readChunk(0, 512));
  }

  /**
   * For faster exec generates  CPU specific opcodes list
   * see:
   * http://csiflabs.cs.ucdavis.edu/~ssdavis/50/8086%20Opcodes.pdf
   * https://en.wikipedia.org/wiki/X86_instruction_listings#Original_8086.2F8088_instructions
   */
  initOpcodeSet() {
    this.opcodes = {
      /** MOV r/m8, reg8 */  0x88: (bits = 0x1) => {
        this.parseRmByte(
          (src, dest)     => this.registers[src] = this.registers[this.regMap[bits][dest]],
          (address, src)  => this.memIO.write[bits](this.registers[src], address),
          bits
        );
      },
      /** MOV r/m16, sreg */  0x8C: () => {
        this.parseRmByte(
          (reg, sreg)         => this.registers[reg] = this.registers[this.regMap.sreg[sreg]],
          (address, _, byte)  => this.memIO.write[bits](this.registers[this.regMap.sreg[byte.reg]], address),
          0x2
        );
      },
      /** MOV sreg, r/m16 */  0x8E: () => {
        this.parseRmByte(
          (reg, sreg)     => this.registers[this.regMap.sreg[sreg]] = this.registers[reg],
          (address, reg)  => { /** todo */ throw new Error('0x8E: Fix me!') },
          0x2
        );
      },
      /** MOV r8, r/m8    */ 0x8A: (bits = 0x1) => {
        this.parseRmByte(
          (l, r) => { /** todo */ throw new Error('0x8A: Fix me!') },
          (address, reg) => this.registers[reg] = this.memIO.read[bits](address),
          bits
        );
      },

      /** MOV al, m8  */ 0xA0: (bits = 0x1) => this.registers[this.regMap[bits][0]] = this.fetchOpcode(bits),
      /** MOV al, m16 */ 0xA1: () => this.opcodes[0xA0](0x2),

      /** MOV m8, al  */ 0xA2: (bits = 0x1) => this.memIO.write[bits](this.registers.al, this.fetchOpcode(bits)),
      /** MOV m16, al */ 0xA3: () => this.opcodes[0xA2](0x2),

      /** MOV r/m8, imm8  */ 0xC6: (bits = 0x1) => {
        this.parseRmByte(
          (l, r)    => { /** todo */ throw new Error('0xC6: Fix me!') },
          (address) => this.memIO.write[bits](this.fetchOpcode(bits), address)
          , bits
        );
      },
      /** MOV r/m16, reg16  */ 0x89:  () => this.opcodes[0x88](0x2),
      /** MOV r16, r/m16    */ 0x8B:  () => this.opcodes[0x8A](0x2),
      /** MOV r/m16, imm16  */ 0xC7:  () => this.opcodes[0xC6](0x2),

      /** PUSH/INC/DEC reg8 */ 0xFE: (bits = 0x1) => {
        this.parseRmByte(
          (register, mode) => {
            const reg = this.regMap[bits][mode.rm];
            if(mode.reg === 0x6)
              this.push(this.registers[reg]);
            else {
              this.registers[reg] = this.alu(
                this.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
                this.registers[reg], null, bits
              );
            }
          },
          (address, reg, mode) => {
            const memVal = this.memIO.read[bits](address);
            if(mode.reg === 0x6)
              this.push(memVal);
            else {
              this.memIO.write[bits](
                this.alu(
                  this.operators.extra[mode.reg === 0x1 ? 'decrement' : 'increment'],
                  memVal, null, bits
                ),
                address
              );
            }
          }, bits
        );
      },
      /** INC/DEC reg16 */  0xFF: () => this.opcodes[0xFE](0x2),

      /** PUSH imm8     */  0x6A: () => this.push(this.fetchOpcode(), 0x2),
      /** PUSH imm16    */  0x68: () => this.push(this.fetchOpcode(0x2), 0x2),

      /** PUSHF         */  0x9C: () => this.push(this.registers.flags),
      /** POPF          */  0x9D: () => this.registers.flags = this.pop(),

      /** LOOP 8bit rel */  0xE2: () => {
        const relativeAddress = this.fetchOpcode();
        if(--this.registers.cx)
          this.relativeJump(relativeAddress);
      },

      /** RET near  */  0xC3: (bits = 0x2) => this.registers.ip = this.pop(),
      /** RET 16bit */  0xC2: (bits = 0x2) => {
        this.registers.ip = this.pop();
        this.pop(this.fetchOpcode(bits, false), false);
      },

      /** CALL 16bit dis  */  0xE8: () => {
        const relative = CPU.getSignedNumber(this.fetchOpcode(0x2), 0x2);

        this.push(this.registers.ip);
        this.registers.ip += relative;
      },

      /** FAR JMP 32bit   */  0xEA: () => {
        Object.assign(this.registers, {
          ip: this.fetchOpcode(0x2),
          cs: this.fetchOpcode(0x2)
        });
      },

      /** STOSB */  0xAA: (bits = 0x1) => {
        this.memIO.write[bits](
          this.registers[this.regMap[bits][0]],
          this.getMemAddress('es', 'di')
        );
        this.dfIncrement(bits);
      },
      /** STOSW */  0xAB: () => this.opcodes[0xAA](0x2),

      /** CLD   */  0xFC: () => this.registers.status.df = 0x0,
      /** STD   */  0xFD: () => this.registers.status.df = 0x1,

      /** MOVSB */  0xA4: (bits = 0x1) => {
        this.memIO.write[bits](
          this.memIO.read[bits](this.getMemAddress('ds', 'si')),
          this.getMemAddress('es', 'di')
        );

        /** Increment indexes */
        this.dfIncrement(bits, 'si');
        this.dfIncrement(bits, 'di');
      },
      /** MOVSW */  0xA5: () => this.opcodes[0xA4](0x2),

      /** LODSB */  0xAC: (bits = 0x1) => {
        this.registers[this.regMap[bits][0x0]] = this.memIO.read[bits](this.getMemAddress('ds', 'si'));
        this.dfIncrement(bits, 'si');
      },
      /** LODSW */  0xAD: () => this.opcodes[0xAC](0x2),

      /** INT imm8    */  0xCD: () => {
        const interrupt = this.interrupts[this.fetchOpcode()];
        if(!interrupt)
          this.logger.error(`unknown interrupt ${interrupt}`);
        else
          interrupt();
      },
      /** XCHG bx, bx */  0x87: () => {
        const l = this.fetchOpcode();
        if(l == 0xDB)
          this.halt('Debug dump!', true);
      },

      /** HLT */  0xF4: this.halt.bind(this),
      /** NOP */  0x90: () => {}
    };

    /** General usage registers opcodes */
    for(let opcode = 0; opcode < Object.keys(this.regMap[0x1]).length; ++opcode) {
      /** MOV register opcodes */
      ((_opcode) => {
        const _r8 = this.regMap[0x1][_opcode]
            , _r16 = this.regMap[0x2][_opcode];

        /** MOV reg8, imm8 $B0 + reg8 code */
        this.opcodes[0xB0 + _opcode] = () => this.registers[_r8] = this.fetchOpcode();

        /** MOV reg16, imm16 $B8 + reg16 code */
        this.opcodes[0xB8 + _opcode] = () => this.registers[_r16] = this.fetchOpcode(2);

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
        this.opcodes[0x58 + _opcode] = () => this.registers[_r16] = this.pop();
      })(opcode);
    }

    /** 8 bit jump instructions set */
    const jmpOpcodes = {
      /** JA  */  0x77: (f) => !f.cf && !f.zf,
      /** JAE */  0x73: (f) => !f.cf,
      /** JB  */  0x72: (f) => f.cf,
      /** JBE */  0x76: (f) => f.cf || f.zf,
      /** JG  */  0x7F: (f) => !f.zf || f.sg === f.of,
      /** JGE */  0x7D: (f) => f.sf === f.of,
      /** JL  */  0x7C: (f) => f.sf !== f.of,
      /** JLE */  0x7E: (f) => f.zg || f.sg !== f.of,

      /** JNE */  0x75: (f) => !f.zf,
      /** JZ  */  0x74: (f) => f.zf
    };
    const jumpIf = (flagCondition, byte) => {
      flagCondition(this.registers.status) && this.relativeJump(byte);
    }
    for(let opcode in jmpOpcodes) {
      ((_opcode) => {
        this.opcodes[_opcode] = () => jumpIf(jmpOpcodes[_opcode], this.fetchOpcode())
      })(opcode);
    }

    /** Create stack */
    this.initStack();

    /**
     * Generate algebra offset calls
     * todo: implement FPU
     */
    this.initALU();
  }

  /**
   * Generate exception
   */
  raiseException() {
    /** todo: Handle it */
    this.halt('Exception occurred!');
    throw Error();
  }

  /**
   * Slow as fuck ALU initializer
   * todo: Make it fast
   */
  initALU() {
    const flagCheckers = {
      /** Carry flag */   [CPU.flags.cf]: function(val, bits) {
        const unsigned = CPU.toUnsignedNumber(val, bits);
        if(val != unsigned)
          return unsigned;
      },
      /** Overflow flag */   [CPU.flags.of]: function(val, bits, l, r) {
        return (l * r >= 0 && l + r < 0) || (l < 0 && l * r > 0 && l + r > 0);
      },
      /** Parity flag */  [CPU.flags.pf]: function(val) {
        return !((val & 0xFF) % 0x2);
      },
      /** Zero flag */    [CPU.flags.zf]: function(val) {
        return val === 0x0;
      },
      /** Sign flag */    [CPU.flags.sf]: function(val, bits) {
        return ((val >> (0x8 * bits - 0x1)) & 0x1) == 0x1;
      }
    };

    /** Key is 0x80 - 0x83 RM Byte */
    this.operators = {
      /** Extra operators used in other opcodes */
      extra: {
        increment: { _c: function(s)    { return s + 1; } },
        decrement: { _c: function(s)    { return s - 1; } },
        mul:       { _c: function(s, d) { return s * d; } },
        div:       { _c: function(s, d) { return s / d; } }
      },

      /** + */ 0b000: { offset: 0x00, _c: function(s, d) { return s + d; } },
      /** - */ 0b101: { offset: 0x28, _c: function(s, d) { return s - d; } },
      /** & */ 0b100: { offset: 0x20, _c: function(s, d) { return s & d; } },
      /** | */ 0b001: { offset: 0x08, _c: function(s, d) { return s | d; } },
      /** ^ */ 0b110: { offset: 0x30, _c: function(s, d) { return s ^ d; } },
      /** = */ 0b111: {
        offset: 0x38,
        _flagOnly: true,
        _c: function(s, d) { return s - d; }
      }
    };

    /** ALU operation checker */
    this.alu = (operator, l, r, bits) => {
      /** Set default flags value for operator */
      let val = operator._c(l, r);
      if(!operator.flags)
        operator.flags = 0xFF;

      /** Value returned after flags */
      for(let key in flagCheckers) {
        if((operator.flags & key) == key) {
          let _val = flagCheckers[key](val, bits, l, r);
          if((_val || _val === 0) && _val !== true)
            val = _val;

          this.registers.flags ^= (-(_val ? 1 : 0) ^ this.registers.flags) & (1 << key);
        }
      }

      /** temp - for cmp and temporary operations */
      return operator._flagOnly ? l : val;
    };

    /** Multiplier opcode is shared with NEG opcode */
    const multiplier = (bits = 0x1, mul) => {
      this.parseRmByte(
        (l, _, byte) => {
          if(byte.reg === 0x2) {
            /** NOT */
            this.registers[l] = ~this.registers[l] & CPU.bitMask[bits];
          } else if(byte.reg === 0x3) {
            /** NEG */
            this.registers[l] = CPU.toUnsignedNumber(-this.registers[l], bits);
            this.registers.status.cf = byte.rm === 0x0 ? 0x0 : 0x1;

          } else
            mul(this.registers[l], byte);
        },
        (address, _, byte) => {
          const val = this.memIO.read[bits](address);

          if(byte.reg === 0x2) {
            /** NOT */
            this.memIO.write[bits](~val & CPU.bitMask[bits], address);

          }  else if(byte.reg === 0x3) {
            /** NEG */
            this.memIO.write[bits](CPU.toUnsignedNumber(-val, bits), address);
            this.registers.status.cf = byte.rm === 0x0 ? 0x0 : 0x1;

          } else
            mul(val, byte)
        }, bits
      );
    }

    /** $80, $81, $82 RM Byte specific */
    Object.assign(this.opcodes, {
      /** OPERATOR r/m8, imm8 */   0x80: (bits = 0x1, src = bits) => {
        this.parseRmByte(
          (register, _o) => {
            this.registers[register] = this.alu(this.operators[_o], this.registers[register], this.fetchOpcode(src), bits);
          },
          (address, reg, mode) => {
            this.memIO.write[bits](
              this.alu(this.operators[mode.reg], this.memIO.read[bits](address), this.fetchOpcode(src), bits),
              address
            );
          }, bits
        );
      },
      /** OPERATOR r/m16, imm8 */  0x83: () => this.opcodes[0x80](0x2, 0x1),
      /** OPERATOR r/m16, imm16 */ 0x81: () => this.opcodes[0x80](0x2),

      /** MULTIPLIER al, r/m8  */  0xF6: () => multiplier(0x1, (val, byte) => {
        if((byte.reg & 0x6) === 0x6) {
          !val && this.raiseException();

          if(byte.reg === 0x7) {
            /** IDIV */
            const _ax = CPU.getSignedNumber(this.registers.ax, 0x2),
                  _val = CPU.getSignedNumber(val);
            this.registers.ax = CPU.toUnsignedNumber(parseInt(_ax / _val)) | CPU.toUnsignedNumber((_ax % _val)) << 8;
          } else {
            /** DIV */
            this.registers.ax = parseInt(this.registers.ax / val) | (this.registers.ax % val) << 8;
          }
        } else {
          /** MUL / IMUL */
          this.registers.ax = CPU.toUnsignedNumber(
            byte.reg === 0x5 ? CPU.getSignedNumber(this.registers.al) * CPU.getSignedNumber(val) : (this.registers.al * val),
            0x2
          );

          if(byte.reg === 0x5)
            this.registers.status.cf = this.registers.status.of = (this.registers.al === this.registers.al);
        }
      }),
      /** MULTIPLIER ax, r/m16 */  0xF7: () => multiplier(0x2, (val, byte) => {
        if((byte.reg & 0x6) === 0x6) {
          !val && this.raiseException();

          /** DIV / IDIV */
          if(byte.reg === 0x7) {
            /** IDIV */
            const num = CPU.getSignedNumber((this.registers.dx << 16) | this.registers.ax, 0x4);

            this.registers.ax = CPU.toUnsignedNumber(parseInt(num / val), 0x2);
            this.registers.dx = CPU.toUnsignedNumber(num % val, 0x2);
          } else {
            /** DIV */
            const num = (this.registers.dx << 16) | this.registers.ax;

            this.registers.ax = parseInt(num / val);
            this.registers.dx = num % val;
          }
        } else {
          /** MUL / IMUL */
          const output = CPU.toUnsignedNumber(
            byte.reg === 0x5 ? CPU.getSignedNumber(this.registers.ax) * CPU.getSignedNumber(val) : (this.registers.ax * val),
            0x4
          );

          this.registers.ax = output & 0xFF;
          this.registers.dx = (output >> 8) & 0xFF;

          if(byte.reg === 0x5)
            this.registers.status.cf = this.registers.status.of = (output === this.registers.ax);
        }
      }),
    });

    for(let key in this.operators) {
      if(key === 'extra')
        continue;

      ((op) => {
        const offset = op.offset;
        const codes = {
          /** OPERATOR r/m8, r8 */ [0x0 + offset]: (bits = 0x1) => {
            this.parseRmByte(
              (l, r) => {
                this.registers[l] = this.alu(op, this.registers[l], this.registers[this.regMap[bits][r]], bits);
              },
              (address, r) => {
                this.memIO.write[bits](
                  this.alu(op, this.memIO.read[bits](address), this.registers[r], bits),
                  address
                );
              }, bits
            );
          },
          /** OPERATOR m8, r/m8 */ [0x2 + offset]: (bits = 0x1) => {
            this.parseRmByte(
              /** todo: test, nasm is not compiling (l, r) */
              (l, r) => {
                this.registers[r] = this.alu(op, this.registers[r], this.registers[this.regMap[bits][l]], bits);
              },
              (address, r) => {
                this.registers[r] = this.alu(op, this.registers[r], this.memIO.read[bits](address), bits);
              }, bits
            );
          },
          /** OPERATOR AL, imm8 */ [0x4 + offset]: (bits = 0x1) => {
            this.registers[this.regMap[bits][0]] = this.alu(op, this.registers[this.regMap[bits][0]], this.fetchOpcode(bits), bits);
          },

          /** OPERATOR AX, imm16  */ [0x5 + offset]: () => this.opcodes[0x4 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x1 + offset]: () => this.opcodes[0x0 + offset](0x2),
          /** OPERATOR r/m16, r16 */ [0x3 + offset]: () => this.opcodes[0x2 + offset](0x2)
        };
        Object.assign(this.opcodes, codes);
      })(this.operators[key]);
    }
  }

  /**
   * Jump to address relative to ip register
   *
   * @param {Integer} byte  Signed byte
   */
  relativeJump(byte) {
    this.registers.ip += CPU.getSignedNumber(byte);
  }

  /**
   * Increment relative to DF register flag
   *
   * @param {Number} bits Bytes to increment
   * @param {String} reg  Register to increment
   */
  dfIncrement(bits = 0x1, reg = 'di') {
    this.registers[reg] += this.registers.status.df ? -bits : bits;
  }

  /**
   * Parse RM mode byte
   * see: http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm
   *
   * @param {Function}  regCallback   Callback if register mode opcode
   * @param {Function}  memCallback   Callback if memory mode opcode
   * @param {Integer}   mode          0x1 if 8bit register, 0x2 if 16bit register
   * @param {Integer}   segRegister   Segment register name, overriden if prefix is given
   */
  parseRmByte(regCallback, memCallback, mode, segRegister = 'ds') {
    const byte = CPU.decodeRmByte(this.fetchOpcode());

    /** Register */
    if(byte.mod === 0x3)
      regCallback(
        this.regMap[mode][byte.rm],
        byte.reg,
        byte
      );

    /** Adress */
    else if(memCallback) {
      let address = 0;
      if(!byte.mod && byte.rm == 0x6)
        address = this.fetchOpcode(2);
      else {
        let displacement = 0;

        /** Eight-bit displacement, sign-extended to 16 bits */
        if(byte.mod === 0x1 || byte.mod === 0x2)
          displacement = this.fetchOpcode(byte.mod);

        /** Calc address */
        switch(byte.rm) {
          case 0x0: address = this.registers.bx + this.registers.di + displacement; break;
          case 0x1: address = this.registers.bx + this.registers.di + displacement; break;
          case 0x4: address = this.registers.si + displacement; break;
          case 0x5: address = this.registers.di + displacement; break;
          case 0x7: address = this.registers.bx + displacement; break;

          case 0x2:
            segRegister = 'ss';
            address = this.registers.bp + this.registers.si + displacement;
          break;
          case 0x3:
            segRegister = 'ss';
            address = this.registers.bp + this.registers.di + displacement;
          break;
          case 0x6:
            segRegister = 'ss';
            address = this.registers.bp + displacement;
          break;

          default:
            this.logger.error('Unknown RM byte address!');
        }
      }

      /** If cpu segment register is present, override default */
      if(this.opcodePrefix)
        segRegister = CPU.prefixes[this.opcodePrefix]._sr || segRegister;

      /** Callback and address calc */
      memCallback(
        CPU.getMemAddress(this.registers[segRegister], address),
        this.regMap[mode][byte.reg],
        byte
      );
    }
  }

  /**
   * Decodes MOD RM bytes
   * see http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm
   *
   * @static
   * @param {Integer} byte  8bit mod rm byte
   * @returns Extracted value
   */
  static decodeRmByte(byte) {
    return {
      mod: byte >> 0x6,
      reg: (byte >> 3) & 0x7,
      rm: byte & 0x7
    };
  }

  /**
   * Get next opcode
   *
   * @param {Integer} size        Opcode size in bytes 8 / 16
   * @param {Boolean} incrementIP Ignore counter if false
   * @returns
   */
  fetchOpcode(size = 1, incrementIP = true) {
    const mapper = this.memIO.read[size];
    if(mapper) {
      const opcode = mapper(this.getMemAddress('cs', 'ip'));
      if(incrementIP)
        this.registers.ip += size;

      return opcode;
    } else
      this.halt('Unknown opcode size!');
  }

  /**
   * Exec CPU
   */
  exec() {
    this.logger.info(`Jump to ${this.registers.ip.toString(16)}`);

    const tick = () => {
      /** Tick */
      let opcode = this.fetchOpcode();
      if(CPU.prefixes[opcode]) {
        /**
         * Its prefix, ignore Tick
         * todo: Do not ignore tick
         */
        this.opcodePrefix = opcode;
      } else {
        let operand = this.opcodes[opcode];
        if(!operand)
          return this.halt(`Unknown opcode 0x${opcode.toString(16).toUpperCase()}`);

        /** Do something with operand, reset opcode prefix */
        if(this.opcodePrefix === 0xF3) {
          /** Save IP register for multiple argument opcode */
          const ip = this.registers.ip;
          do {
            operand();
            this.registers.ip = ip;
          } while(this.registers.cx = CPU.toUnsignedNumber(this.registers.cx - 0x1, 0x2));
        } else
          operand();

        /** Reset opcode */
        this.opcodePrefix = 0x0;
      }
    };

    /** Check processor mode */
    if(this.config.clockSpeed)
      this.clock = setInterval(tick, this.config.clockSpeed);
    else {
      this.clock = true;
      while(true) {
        tick();
        if(!this.clock)
          break;
      }
    }
  }

  /**
   * Force turn off CPU
   *
   * @param {String}  msg   Error message
   * @param {Boolean} dump  Dump registers
   */
  halt(msg, dump) {
    if(!this.clock)
      this.logger.warn('CPU is already turned off');
    else {
      this.clock = clearInterval(this.clock);

      /** Optional args */
      msg && this.logger.warn(msg);
      if(dump) {
        this.dumpRegisters();
        this.logger.warn(this.mem);
      }
    }
  }

  /**
   * Print contents of registers in table
   *
   * @param {string} loggerInfo Logger description text
   */
  dumpRegisters(loggerInfo = 'Dump registers:') {
    const insertDot = function(str, pos) {
        return str.slice(0, pos) + '.' + str.slice(pos);
    };

    const table = new Table({
      head: ['Register', 'Value']
    });
    for(let key of Object.keys(this.registers)) {
      let reg = this.registers[key];
      if(isNaN(reg))
        continue;

      let val = reg.toString(2).toUpperCase();
      if(val.length < 16)
        val = new Array(16 - val.length + 1).join('0') + val;

      /** add dots to easier reading value */
      table.push({
        [key]: [insertDot(val, 8)]
      });
    }
    this.logger.warn(loggerInfo + '\n' + table.toString());
  }

  /**
   * Read chunk of data from device
   *
   * @param {any} offset
   * @param {any} size
   * @returns
   */
  readChunk(offset, size) {
    if(!this.device)
      throw new Error('Cannot read from empty device');

    const buffer = new Buffer(size);
    if(this.device instanceof Buffer) {
      buffer.fill(0);
      this.device.copy(buffer, 0, offset, Math.min(this.device.length, size));
    } else
      this.halt('Unknown storage memory driver!');
    return buffer;
  }

  /**
   * Load buffer into address in RAM memory
   *
   * @param {Buffer}  buffer  Data
   * @param {Integer} address Memory physical address
   * @param {Integer} size    Buffer size, default buffer.size
   */
  loadBuffer(buffer, address, size = buffer.length) {
    buffer.copy(this.mem, address, 0, size);
    return this.mem;
  }

  /**
   * Check code magic number, at the end of 512B
   * block there should be magic number
   *
   * @static
   * @param {Buffer} code First 512B of machine code
   */
  loadMBR(code) {
    if(this.config.ignoreMagic || code.readUInt16LE(510) == 0xAA55) {
      this.logger.info('Booting from MBR');

      /** CS:IP */
      Object.assign(this.registers, {
        cs: 0x0,
        ip: 0x7c00
      });
      this.loadBuffer(
        code,
        this.getMemAddress('cs', 'ip'),
        510
      );

      /** RUN */
      this.exec();
    } else
      this.logger.error('Unable to boot device!');
  }

  /**
   * Convert segment based address to flat
   *
   * @param {Integer} sreg  Segment register
   * @param {Integer} reg   Normal register
   * @returns
   */
  getMemAddress(sreg, reg) {
    return (this.registers[sreg] << 4) + this.registers[reg];
  }

  /**
   * Convert segment based address to flat
   *
   * @static
   * @param {Number}  seg     Segment index
   * @param {Number}  offset  Memory offset
   * @returns Physical mem address
   */
  static getMemAddress(seg, offset) {
    return (seg << 4) + offset;
  }

  /**
   * Convert signed byte number to normal
   * see: http://stackoverflow.com/questions/11433789/why-is-the-range-of-signed-byte-is-from-128-to-127-2s-complement-and-not-fro
   *
   * @static
   * @param {Number}  num   Number
   * @param {Number}  bits  0x1 if 8bits, 0x2 if 16 bits
   * @returns Signed number
   */
  static getSignedNumber(num, bits = 0x1) {
    const sign = (num >> (0x8 * bits - 0x1)) & 0x1;
    if(sign)
      num -= CPU.bitMask[bits];
    return num;
  }

  /**
   * Convert signed byte number to unsigned
   *
   * @static
   * @param {Number}  num   Number
   * @param {Number}  bits  0x1 if 8bits, 0x2 if 16 bits
   * @returns Unsigned number
   */
  static toUnsignedNumber(num, bits = 0x1) {
    const up = CPU.bitMask[bits];
    if(num >= up)
      return num - up - 0x1;
    else if(num < 0x0)
      return up + num + 0x1;
    else
      return num;
  }
}

/** Only for speedup calc */
CPU.bitMask = {
  0x1: (0x2 << 0x7) - 0x1,
  0x2: (0x2 << 0xF) - 0x1,
  0x4: (0x2 << 0x1F) - 0x1
};

module.exports = CPU;
