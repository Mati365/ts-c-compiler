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
    this.mem = Buffer.alloc(8388608); // real mode 1024KB
    this.clockSpeed = 500; // debug only

    this.registers = {
      /** Main registers */
      ax: 0x0,
      bx: 0x0,
      cx: 0x0,
      dx: 0x0,

      /** Index registers */
      si: 0x0,
      di: 0x0,
      bp: 0x0,
      sp: 0x0,

      /** Instruction counter */
      ip: 0x0,

      /** Segment registers */
      cs: 0x0,
      ds: 0x0,
      es: 0x0,
      ss: 0x0,

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

    // https://en.wikipedia.org/wiki/X86_instruction_listings#Original_8086.2F8088_instructions
    this.opcodes = {
      /** MOV reg8, imm8 */
      0xB0: { len: 2, f: (args) => {
        console.log(args);
      } }
    };

    /** Boot sequence */
    Object.assign(this.registers, {
      dl: 0x1
    });
    this.loadMBR(this.readChunk(0, 512));
  }

  /**
   * Exec CPU
   */
  exec() {
    winston.log('info', `Jump to ${this.registers.ip.toString(16)}`)
    this.clock = setInterval(() => {
      /** Tick */
      let opcode = this.mem.readUInt8(this.getMemAddress('cs', 'ip'))
        , operand = this.opcodes[opcode];
      if(!operand) {
        winston.log('error', `Unknown opcode 0x${opcode.toString(16).toUpperCase()}`);
        return this.halt();
      }

      /** Move instruction pointer, it can change(jmp, call, ret etc.) */
      this.registers.ip += operand.len;

      /** Do something with operand */
      operand.f();

    }, this.clockSpeed);
  }

  /**
   * Power off CPU
   */
  halt() {
    if(!this.clock)
      winston.log('info', 'CPU is not turned on');
    else
      this.clock = clearInterval(this.clock);
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