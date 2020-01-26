import * as R from 'ramda';

import {
  X86_BINARY_MASKS,
  X86_REGISTERS,
  X86_PREFIXES,
  X86_PREFIX_LABEL_MAP,
} from './constants/x86';

import {
  X86AbstractCPU,
  X86RegName,
  RMByte,
  X86SegmentPrefix,
  X86BitsMode,
  X86RAM,
} from './types';

import {X86Stack} from './X86Stack';
import {X86ALU} from './X86ALU';
import {X86IO} from './X86IO';
import {X86InstructionSet} from './X86InstructionSet';

type X86CPUConfig = {
  ignoreMagic?: boolean,
  debugger?: boolean,
  silent?: boolean,
};

/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
export class X86CPU extends X86AbstractCPU {
  private config: X86CPUConfig;

  public stack: X86Stack;
  public alu: X86ALU;
  public io: X86IO;
  public instructionSet: X86InstructionSet;

  public device: Buffer;
  public opcodes: {[opcode: number]: (...args: any[]) => void} = {};

  constructor(config?: X86CPUConfig) {
    super();

    this.config = config || {
      ignoreMagic: false,
      debugger: false,
      silent: false,
    };

    this.mem = Buffer.alloc(1114112);
    this.memIO = new X86RAM<X86CPU>(this, this.mem);

    this.stack = new X86Stack(this);
    this.alu = new X86ALU(this);
    this.io = new X86IO(this);
    this.instructionSet = new X86InstructionSet(this);
  }

  /**
   * Sets boot CPU device, loads MBR into memory and jumps there
   *
   * @param {(Buffer|string)} device
   * @param {number} id
   * @memberof X86CPU
   */
  boot(device: Buffer|string, id: number = 0x0): void {
    /** Convert HEX string to Node buffer */
    if (typeof device === 'string')
      device = Buffer.from(device, 'hex');

    /** Remove logging if silent */
    if (this.config.silent)
      this.logger.setSilent(true);

    /** Booting procedure */
    this.clock = true;
    this.device = device;

    Object.assign(
      this.registers,
      {
        dl: id,
      },
    );

    this.logger.info('CPU: Intel 8086 compatible processor');
    this.loadMBR(this.readChunk(0, 512));
  }

  /**
   * Check code magic number, at the end of 512B
   * block there should be magic number
   *
   * @static
   * @param {Buffer} code First 512B of machine code
   */
  loadMBR(code: Buffer): void {
    if (this.config.ignoreMagic || code.readUInt16LE(510) === 0xAA55) {
      this.logger.info('Booting from MBR');

      /** CS:IP */
      Object.assign(
        this.registers,
        {
          cs: 0x0,
          ss: 0x0,
          ip: 0x7c00,
          sp: 0xffd6, // same as bochs
        },
      );
      this.loadBuffer(
        code,
        this.getMemAddress('cs', 'ip'),
        510,
      );
    } else
      this.halt('Unable to boot device!');
  }

  /**
   * Read chunk of data from device
   *
   * @param {number} offset
   * @param {number} size
   * @returns {Buffer}
   * @memberof X86CPU
   */
  readChunk(offset: number, size: number): Buffer {
    if (!this.device)
      throw new Error('Cannot read from empty device');

    const buffer = Buffer.alloc(size);
    if (this.device instanceof Buffer) {
      buffer.fill(0);
      this.device.copy(buffer, 0, offset, Math.min(this.device.length, size));
    } else
      this.halt('Unknown storage memory driver!');

    return buffer;
  }

  /**
   * Loads buffer into RAM at specified address
   *
   * @param {Buffer} buffer
   * @param {number} address
   * @param {number} [size=buffer.length]
   * @returns {Buffer}
   * @memberof X86CPU
   */
  loadBuffer(buffer: Buffer, address: number, size: number = buffer.length): Buffer {
    buffer.copy(this.mem, address, 0, size);
    return this.mem;
  }

  /**
   * Exec CPU
   *
   * @param {Number}  cycles  Instructions counter
   * @returns Cycles count
   */
  exec(cycles: number): void {
    if (!this.clock)
      return;

    const tick = () => {
      /** Tick */
      if (this.pause)
        return;

      /** Decode prefix */
      let opcode = null;
      for (let i = 0x0; i < 0x4; ++i) {
        opcode = this.fetchOpcode(0x1, true, true);

        const prefix = X86_PREFIXES[opcode];
        if (typeof prefix === 'undefined')
          break;

        /** Segment registers have object instead of opcode */
        const segmentOverride = (<X86SegmentPrefix> prefix)._sr;
        if (segmentOverride)
          this.prefixes[X86_PREFIX_LABEL_MAP[0x1]] = prefix;
        else
          this.prefixes[X86_PREFIX_LABEL_MAP[<number> prefix]] = opcode;
      }

      /** 0F prefix opcodes to 2-byte opcodes */
      if (opcode === 0x0F)
        opcode = (opcode << 0x8) | this.fetchOpcode(0x1, true, true);

      /** Decode opcode */
      const operand = this.opcodes[opcode];
      if (!operand) {
        this.halt(`Unknown opcode 0x${opcode.toString(16).toUpperCase()}`);
        return;
      }

      /** REP - Do something with operand, reset opcode prefix */
      if (this.prefixes.instruction === 0xF3) {
        const {ip} = this.registers;
        do {
          /** Revert IP, */
          this.registers.ip = ip;

          /** Decrement CX */
          operand();
          this.registers.cx = X86AbstractCPU.toUnsignedNumber(this.registers.cx - 0x1, 0x2);

          /** Stop loop if zf, check compare flags for SCAS, CMPS  */
          if (!this.registers.status.zf && !!~[0xAF, 0xAE, 0xA6, 0xA7].indexOf(opcode))
            break;
        } while (this.registers.cx);
      } else
        operand();

      /** Reset opcode */
      for (const key in this.prefixes)
        this.prefixes[key] = null;
    };

    /** Exec CPU */
    if (cycles) {
      for (let i = 0; i < cycles && this.clock; ++i)
        tick();
    } else {
      while (this.clock)
        tick();
    }
  }

  /**
   * Get next opcode
   *
   * @param {Integer} size          Opcode size in bytes 8 / 16
   * @param {Boolean} incrementIP   Ignore counter if false
   * @param {Boolean} ignorePrefix  True to ignore override
   * @returns
   */
  fetchOpcode(size: number = 0x1, incrementIP: boolean = true, ignorePrefix: boolean = false): number {
    if (!ignorePrefix && this.prefixes.operandSize === 0x66)
      size = 0x4;

    const mapper = this.memIO.read[size];
    if (mapper) {
      const opcode = mapper(this.getMemAddress('cs', 'ip'));
      if (incrementIP) {
        this.registers.ip += size;

        // increment CS if overflows
        if (this.registers.ip > 0xFFFF) {
          this.registers.ip = X86AbstractCPU.toUnsignedNumber(this.registers.ip, 0x2);
          this.registers.cs += 0x1000;
        }
      }

      return opcode;
    }

    this.halt('Unknown opcode size!');
    return null;
  }

  /**
   * Raise exception to all devices
   *
   * @param {Number} code Raise exception
   */
  raiseException(code: number): void {
    R.forEachObjIndexed(
      (device) => device.exception(code),
      this.devices,
    );
  }

  /**
   * Fetch opcodes and jump to address
   * relative to ip register. If rel < 0
   * sub 1B instruction size
   *
   * @param {X86BitsMode} bits
   * @param {number} relative
   * @memberof X86CPU
   */
  relativeJump(bits: X86BitsMode, relative?: number): void {
    const {registers} = this;

    relative = relative ?? this.fetchOpcode(bits);

    /** 1B call instruction size */
    relative = X86AbstractCPU.getSignedNumber(relative, bits);
    registers.ip += relative - (relative < 0 ? 0x1 : 0);

    /**
     * If overflows its absolute, truncate value
     * dont know why, its undocummented
     */
    if (registers.ip > X86_BINARY_MASKS[0x2] + 1)
      registers.ip &= 0xFF;
  }

  /**
   * Increment relative to DF register flag, used in file loaders
   *
   * @see
   *  Only for 16bit registers!
   *
   * @param {number} [delta=0x1] Value to increment
   * @param {...X86RegName[]} args
   * @memberof X86CPU
   */
  dfIncrement(delta: number = 0x1, ...args: X86RegName[]): void {
    const {registers} = this;

    // todo: Move to ALU
    const dir = (
      registers.status.df
        ? -delta
        : delta
    );

    for (let i = 0; i < args.length; ++i) {
      registers[<string> args[i]] = X86AbstractCPU.toUnsignedNumber(
        registers[<string> args[i]] + dir,
        0x2,
      );
    }
  }

  /**
   * Parse RM mode byte
   * see: http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm
   *
   * @param {(reg: X86RegName, regByte: number, rmByte: RMByte) => void} regCallback
   * @param {(address: number, reg: X86RegName, rmByte: RMByte) => void} memCallback
   * @param {X86BitsMode} mode
   * @param {X86RegName} [segRegister=this.segmentReg]
   * @memberof X86CPU
   */
  parseRmByte(
    regCallback: (reg: X86RegName, regByte: number, rmByte: RMByte) => void,
    memCallback: (address: number, reg: X86RegName, rmByte: RMByte) => void,
    mode: X86BitsMode,
    segRegister: X86RegName = this.segmentReg,
  ) {
    const byte = X86AbstractCPU.decodeRmByte(
      this.fetchOpcode(0x1, true, true),
    );

    /** Register */
    if (byte.mod === 0x3)
      regCallback(
        X86_REGISTERS[mode][byte.rm],
        byte.reg,
        byte,
      );

    /** Adress */
    else if (memCallback) {
      let address = 0,
        displacement = 0;

      if (!byte.mod && byte.rm === 0x6) {
        /** SIB Byte? */
        address = this.fetchOpcode(0x2);
      } else {
        /** Eight-bit displacement, sign-extended to 16 bits */
        if (byte.mod === 0x1 || byte.mod === 0x2)
          displacement = this.fetchOpcode(byte.mod);

        /** Calc address */
        const {registers} = this;
        switch (byte.rm) {
          case 0x0: address = registers.bx + registers.si + displacement; break;
          case 0x1: address = registers.bx + registers.di + displacement; break;
          case 0x2: address = registers.bp + registers.si + displacement; break;
          case 0x3: address = registers.bp + registers.di + displacement; break;

          case 0x4: address = registers.si + displacement; break;
          case 0x5: address = registers.di + displacement; break;
          case 0x6: address = registers.bp + displacement; break;
          case 0x7: address = registers.bx + displacement; break;

          default:
            this.logger.error('Unknown RM byte address!');
        }

        /** Seg register ss is set with 0x2, 0x3, 0x6 opcodes */
        if (byte.rm >= 0x2 && !(0x6 % byte.rm) && segRegister === 'ds')
          segRegister = 'ss';
      }

      if (segRegister)
        address = this.getMemAddress(segRegister, address);

      /** Callback and address calc */
      memCallback(
        /** Only effective address */
        address,
        X86_REGISTERS[mode][byte.reg],
        byte,
      );
    }
  }

  /**
   * Rotate bits to left with carry flag
   *
   * @see {@link https://github.com/NeatMonster/Intel8086/blob/master/src/fr/neatmonster/ibmpc/Intel8086.java#L4200}
   *
   * @param {number} num Number
   * @param {number} times Bits to shift
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof X86CPU
   */
  rotl(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const mask = X86_BINARY_MASKS[bits];
    const {registers: {status}} = this;

    for (; times >= 0; --times) {
      const cf = 0;

      num <<= 0x1;
      num |= cf;
      num &= mask;
      status.cf = cf;
    }

    return num;
  }

  /**
   * Shift bits to right with carry flag
   * see: https://github.com/NeatMonster/Intel8086/blob/master/src/fr/neatmonster/ibmpc/Intel8086.java#L4200
   *
   * @param {number} num
   * @param {number} times Bits to shift
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof X86CPU
   */
  shr(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const {status} = this.registers;
    const mask = X86_BINARY_MASKS[bits];

    for (; times > 0; --times) {
      status.cf = num & 0x1;
      num >>= 0x1;
      num &= mask;
    }

    status.zf = +(num === 0);
    status.of = X86AbstractCPU.msbit(num) ^ status.cf;

    return num;
  }

  /**
   * Shift bits to left with carry flag
   *
   * @param {number} num
   * @param {number} times Bits to shift
   * @param {X86BitsMode} [bits=0x1]
   * @returns
   * @memberof X86CPU
   */
  shl(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const {status} = this.registers;
    const mask = X86_BINARY_MASKS[bits];

    for (; times > 0; --times) {
      status.cf = X86AbstractCPU.msbit(num, bits);
      num <<= 0x1;
      num &= mask;
    }

    status.zf = +(num === 0);
    status.of = X86AbstractCPU.msbit(num) ^ status.cf;

    return num;
  }

  /**
   * Fast bit rotate
   *
   * @param {number} num
   * @param {number} times Bits to shift
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof X86CPU
   */
  rotate(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const {status} = this.registers;
    const mask = X86_BINARY_MASKS[bits];

    if (times > 0) {
      num = (num >> (mask - times)) | (num << times);
      status.cf = num & 0x1;
    } else {
      num = (num << (mask + times)) | (num >> -times);
      status.cf = X86AbstractCPU.msbit(num, bits);
    }

    status.zf = +(num === 0);
    status.of = 0x0;

    return num;
  }

  /**
   * Shut down emulator, if dump is enabled show all registers into console
   *
   * @param {string} [message]
   * @param {boolean} [dump]
   * @memberof X86CPU
   */
  halt(message?: string, dump?: boolean): void {
    if (!this.clock)
      this.logger.warn('CPU is already turned off');
    else {
      this.clock = false;

      /** Optional args */
      if (message)
        this.logger.warn(message);

      if (dump) {
        this.debugDumpRegisters();
        this.logger.warn(this.mem);
      }

      /** Next instruction */
      this.logger.info(`Halt! Next instruction ${this.fetchOpcode(0x2).toString(16)}`);
    }
  }
}
