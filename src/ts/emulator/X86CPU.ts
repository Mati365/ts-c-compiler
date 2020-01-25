import {
  X86_PREFIXES,
  X86_PREFIX_LABEL_MAP,
  X86SegmentPrefix,
} from './constants/x86';

import {X86AbstractCPU} from './types';
import {X86Stack} from './X86Stack';

type X86CPUConfig = {
  ignoreMagic?: boolean,
  debugger?: boolean,
  silent?: boolean,
};

/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
export class X86CPU extends X86AbstractCPU {
  private config: X86CPUConfig;
  private stack: X86Stack;

  private device: Buffer;
  public opcodes: {[opcode: number]: () => void} = {};

  constructor(config?: X86CPUConfig) {
    super();

    this.config = config || {
      ignoreMagic: false,
      debugger: false,
      silent: false,
    };

    this.stack = new X86Stack(this);
  }

  /**
   * Sets boot CPU device, loads MBR into memory and jumps there
   *
   * @param {(Buffer|string)} device
   * @param {number} id
   * @memberof X86CPU
   */
  boot(device: Buffer|string, id: number): void {
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
