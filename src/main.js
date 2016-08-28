'use strict';

const fs = require('fs')
    , winston = require('winston')
    , Table = require('cli-table');

/**
 * Main code exec
 * @class CPU
 */
class CPU {
  /**
   * Creates an instance of CPU.
   *
   * @param {any} device  Node file pointer
   */
  constructor(device) {
    this.device = device;
    this.clockSpeed = 10; // debug only

    /** Interrupts */
    this.interrupt = 0x0;

    /**
     * Alloc 1024 KB of RAM memory
     * todo: Implement A20 line support
     */
    this.mem = Buffer.alloc(8388608);
    this.memMapper = {
      /** for 8bit registers */
      0x1: this.mem.readUInt8.bind(this.mem),

      /** for 16bit registers */
      0x2: this.mem.readUInt16LE.bind(this.mem)
    };

    this.registers = {
      /** Main registers */
      ax: 0x0, bx: 0x0, cx: 0x0, dx: 0x0,

      /** Index registers */
      si: 0x0, di: 0x0, bp: 0x0, sp: 0x0,

      /** Instruction counter */
      ip: 0x0,

      /** Segment registers */
      cs: 0x0, ds: 0x0, es: 0x0, ss: 0x0,

      /** Flags */
      status: 0x0
    };

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

    /** Boot sequence */
    Object.assign(this.registers, {
      dl: 0x1
    });
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
      /** MOV sreg, r/m16 */  0x8E: () => {
        this.modeRegParse(
          (r, sreg) => this.registers[this.regMap.sreg[sreg]] = this.registers[r],
          (address, reg) => {
            /** todo */
          }, 0x2
        );
      },

      /** XCHG bx, bx   */  0x87: () => {
        const l = this.fetchOpcode();
        if(l == 0xDB)
          this.halt('Debug dump!', true);
      },

      /** HLT */  0xF4: () => this.halt()
    };
    for(let opcode = 0; opcode < Object.keys(this.regMap[0x1]).length; ++opcode) {
      /** MOV register opcodes */
      ((_opcode) => {
        /** MOV reg8, imm8 $B0 + reg8 code */
        const _r8 = this.regMap[0x1][_opcode];
        this.opcodes[0xB0 + _opcode] = () => {
          this.registers[_r8] = this.fetchOpcode();
        };

        /** MOV reg16, imm16 $B8 + reg16 code */
        const _r16 = this.regMap[0x2][_opcode];
        this.opcodes[0xB8 + _opcode] = () => {
          this.registers[_r16] = this.fetchOpcode(2);
        };
      })(opcode);
    }

    /**
     * Generate algebra offset calls
     * todo: implement FPU
     */
    this._initALU();
  }

  /**
   * Slow as fuck ALU initializer
   */
  _initALU() {
    const operators = {
      '+': { offset: 0x00, _c: function(a, b) { return a + b } },
      '-': { offset: 0x28, _c: function(a, b) { return a - b } },
      '&': { offset: 0x20, _c: function(a, b) { return a & b } },
      '|': { offset: 0x08, _c: function(a, b) { return a | b } },
      '^': { offset: 0x30, _c: function(a, b) { return a ^ b } }
    };
    for(let key in operators) {
      (({offset, _c}) => {
        const codes = {
          /** ADD r/m8, reg8 */ [0x0 + offset]: (bits = 0x1) => {
            this.modeRegParse(
              (l, r) => {
                this.registers[l] = _c(this.registers[l], this.registers[this.regMap[bits][r]])
              },
              (address, r) => {
                this.mem[address] = _c(this.mem[address], this.registers[r])
              }, bits
            );
          },
          /** ADD r/m16, reg16 */ [0x1 + offset]: () => this.opcodes[0x0 + offset](0x2),
          /** ADD r/m8, reg8 */   [0x2 + offset]: (bits = 0x1) => {
            this.modeRegParse(
              /** todo: test, nasm is not compiling (l, r) */
              (l, r)       => {
                this.registers[r] = _c(this.registers[r], this.registers[this.regMap[bits][l]])
              },
              (address, r) => {
                this.registers[r] = _c(this.registers[r], this.mem[address]);
              }, bits
            );
          },
          /** ADD r/m16, reg16 */ [0x3 + offset]: () => this.opcodes[0x2](0x2 + offset),
          /** ADD AL, imm8  */    [0x4 + offset]: () => this.registers.al = _c(this.registers.al, this.fetchOpcode()),
          /** ADD AX, imm16 */    [0x5 + offset]: () => this.registers.ax = _c(this.registers.ax, this.fetchOpcode(2)),
          /** ADD r/m8, imm8 */   [0x80 + offset]: (bits = 0x1) => {
            this.modeRegParse(
              (register)  => this.registers[register] += this.fetchOpcode(bits),
              (address)   => this.mem[address] += this.fetchOpcode(bits),
              bits
            );
          },
          /** ADD r/m16, imm16 */ [0x81 + offset]: () => this.opcodes[0x80 + offset](0x2),
          /** ADD r/m16, imm8 */  [0x83 + offset]: () => this.opcodes[0x80 + offset](),
        };
        Object.assign(this.opcodes, codes);
      })(operators[key]);
    }
  }

  /**
   * Parse RM mode byte
   * see: http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm
   *
   * @param {Function}  regCallback  Callback if register mode opcode
   * @param {Function}  memCallback  Callback if memory mode opcode
   * @param {Integer}   register     0x1 if 8bit register, 0x2 if 16bit register
   * @param {Integer}   segRegister Segment register name
   */
  modeRegParse(regCallback, memCallback, mode, segRegister = 'ds') {
    const byte = CPU.decodeModRmByte(this.fetchOpcode());

    /** Register */
    if(byte.mod === 0x3)
      regCallback(
          this.regMap[mode][byte.rm]
        , byte.reg
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

        /**
         * Calc address
         * todo: Is it segment address? If yes (segment << 4) + address
         */
        switch(byte.rm) {
          case 0x0: address = this.registers.bx + this.registers.di + displacement; break;
          case 0x1: address = this.registers.bx + this.registers.di + displacement; break;
          case 0x2: address = this.registers.bp + this.registers.si + displacement; break;
          case 0x3: address = this.registers.bp + this.registers.di + displacement; break;

          case 0x4: address = this.registers.si + displacement; break;
          case 0x5: address = this.registers.di + displacement; break;
          case 0x6: address = this.registers.bp + displacement; break;
          case 0x7: address = this.registers.bx + displacement; break;
        }
      }
      memCallback(
        this.registers[segRegister] + address,
        this.regMap[mode][byte.reg]
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
  static decodeModRmByte(byte) {
    return {
      mod: byte >> 0x6,
      reg: (byte >> 3) & 0x7,
      rm: byte & 0x7
    };
  }

  /**
   * Get next opcode
   *
   * @param {Integer} size  Opcode size in bytes 8 / 16
   * @returns
   */
  fetchOpcode(size = 1) {
    const mapper = this.memMapper[size];
    if(mapper) {
      const opcode = mapper(this.getMemAddress('cs', 'ip'));
      this.registers.ip += size;

      return opcode;
    } else
      this.halt('Unknown opcode size!');
  }

  /**
   * Exec CPU
   */
  exec() {
    winston.log('info', `Jump to ${this.registers.ip.toString(16)}`)
    this.clock = setInterval(() => {
      /** Tick */
      let opcode = this.fetchOpcode()
        , operand = this.opcodes[opcode];
      if(!operand)
        return this.halt(`Unknown opcode 0x${opcode.toString(16).toUpperCase()}`);

      /** Do something with operand */
      operand();

    }, this.clockSpeed);
  }

  /**
   * Force turn off CPU
   *
   * @param {String}  errorMsg Error message
   * @param {Boolean} dump     Dump registers
   */
  halt(errorMsg, dump) {
    if(!this.clock)
      winston.log('info', 'CPU is not turned on');
    else {
      this.clock = clearInterval(this.clock);

      /** Optional args */
      errorMsg && winston.log('error', errorMsg);
      if(dump) {
        this.dumpRegisters();
        winston.log('info', this.mem);
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
      let val = this.registers[key].toString(2);
      if(val.length < 16)
        val = new Array(16 - val.length + 1).join('0') + val;

      /** add dots to easier reading value */
      table.push({
        [key]: [insertDot(val, 8)]
      });
    }
    winston.log('info', loggerInfo + '\n' + table.toString());
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
    fs.readSync(this.device, buffer, 0, size, offset);
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
    if(code.readUInt16LE(510) == 0xAA55) {
      winston.log('info', 'Booting device!');

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
      this.dumpRegisters();
      this.exec();
    } else
      winston.log('error', 'Unable to boot device!');
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
}

/** Read boot device */
fs.open('test/build/bootsec.bin', 'r', (status, fd) => {
  if (status) {
    winston.log('error', status.message);
    return;
  }
  new CPU(fd);
});