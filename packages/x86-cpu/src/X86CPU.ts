import * as R from 'ramda';
import { Buffer } from 'buffer';

import { getMSbit } from '@ts-cc/core';
import {
  RMByte,
  X86BitsMode,
  toUnsignedNumber,
  getSignedNumber,
  unsafeAsmBinary,
  X86RegName,
  SegmentedAddress,
} from '@ts-cc/x86-assembler';

import { BINARY_MASKS } from '@ts-cc/core';
import {
  X86_REGISTERS,
  X86_PREFIXES,
  X86_PREFIX_LABEL_MAP,
  X86_BINARY_MASKS,
} from './constants/x86';

import {
  X86AbstractCPU,
  X86SegmentPrefix,
  X86RAM,
  X86Interrupt,
  X86InterruptType,
} from './parts';

import { X87 } from './x87/X87';
import { X86Stack } from './X86Stack';
import { X86ALU } from './X86ALU';
import { X86IO } from './X86IO';
import { X86InstructionSet } from './X86InstructionSet';
import { BIOS, CMOS, Keyboard, PIT, VGA } from './devices';

import { FAKE_BIOS } from './devices/BIOS/asm';

type X86CPUConfig = {
  debugger?: boolean;
  silent?: boolean;
  handle?: {
    onHalt?: VoidFunction;
    onBoot?: VoidFunction;
  };
};

export type X86OpcodesList = ((...args: any[]) => void)[];
export type X86RegRMCallback = (
  reg: X86RegName,
  regByte: number,
  rmByte: RMByte,
  mode?: X86BitsMode,
) => void;
export type X86MemRMCallback = (
  address: number,
  reg: X86RegName,
  rmByte: RMByte,
  mode?: X86BitsMode,
) => void;

export class X86CPU extends X86AbstractCPU {
  private config: X86CPUConfig;

  public instructionStartAddress: SegmentedAddress = new SegmentedAddress(null, null);

  public stack: X86Stack;
  public alu: X86ALU;
  public io: X86IO;
  public instructionSet: X86InstructionSet;
  public x87: X87;
  public device: Buffer;
  public opcodes: X86OpcodesList = [];

  constructor(config?: X86CPUConfig) {
    super();

    this.config = config || {
      debugger: false,
      silent: false,
    };

    this.attach(PIT).attach(CMOS).attach(VGA).attach(Keyboard).attach(BIOS);

    this.mem = new Uint8Array(1048576);
    this.memIO = new X86RAM<X86CPU>(this, this.mem);

    this.stack = new X86Stack(this);
    this.alu = new X86ALU(this);
    this.io = new X86IO(this);
    this.instructionSet = new X86InstructionSet(this);
    this.x87 = new X87(this);
  }

  get physicalIP() {
    return this.getMemAddress('cs', 'ip');
  }

  /**
   * Prints all content of registers/flags into logger
   */
  debugDumpRegisters(): void {
    super.debugDumpRegisters();
    this.x87.debugDumpRegisters();
  }

  /**
   * Sets boot CPU device, loads MBR into memory and jumps there
   */
  boot(device: Buffer | string, id: number = 0x0): void {
    /** Convert HEX string to Node buffer */
    if (typeof device === 'string') {
      device = Buffer.from(device, 'hex');
    }

    /** Remove logging if silent */
    if (this.config.silent) {
      this.logger.setSilent(true);
    }

    /** Booting procedure */
    this.clock = true;
    this.device = device;

    const { memIO, registers } = this;
    Object.assign(registers, {
      dl: id,
    });

    // jmp to reset vector
    memIO.writeBytesBE(0xffff0, unsafeAsmBinary()('jmp 0xF000:0x0000'));
    memIO.writeBytesBE(0xf0000, unsafeAsmBinary()(FAKE_BIOS));

    Object.assign(registers, {
      cs: 0xffff,
      ip: 0x0,
      ss: 0x0,
      sp: 0xffd6, // same as bochs
      flags: 0x82,
    });

    R.forEachObjIndexed(cpuDevice => cpuDevice.boot(), this.devices);

    this.config.handle?.onBoot?.();
    this.logger.info(
      'CPU: Intel 8086 compatible processor, jumping to 0xFFFF0 reset vector!',
    );
  }

  /**
   * Read chunk of data from device
   */
  readChunk(offset: number, size: number): Buffer {
    if (!this.device) {
      throw new Error('Cannot read from empty device');
    }

    const buffer = Buffer.alloc(size);
    if (this.device instanceof Buffer) {
      buffer.fill(0);
      this.device.copy(buffer, 0, offset, Math.min(this.device.length, size));
    } else {
      this.halt('Unknown storage memory driver!');
    }

    return buffer;
  }

  /**
   * Loads buffer into RAM at specified address
   */
  loadBuffer(buffer: Buffer, address: number, size: number = buffer.length): Uint8Array {
    buffer.copy(Buffer.from(this.mem.buffer), address, 0, size);
    return this.mem;
  }

  /**
   * Calls interrupt which can be JS callback or IVT entry
   *
   * @todo
   *  Implement triple fault!
   *
   * @see
   *  {@link https://stackoverflow.com/questions/3149175/what-is-the-difference-between-trap-and-interrupt}
   */
  interrupt(interrupt: X86Interrupt): boolean {
    const { code, maskable, type } = interrupt;
    const { registers, stack, memIO, instructionStartAddress } = this;

    if (maskable && !registers.status.if) {
      return false;
    }

    const handler = this.interrupts[code];
    if (!handler) {
      stack.push(registers.flags);

      // repeat instruction if fault
      if (type === X86InterruptType.FAULT) {
        stack.push(instructionStartAddress.segment).push(instructionStartAddress.offset);
      } else {
        stack.push(registers.cs).push(registers.ip);
      }

      registers.status.if = 0x0;
      registers.status.tf = 0x0;
      registers.status.af = 0x0;

      const interruptOffset = code << 2;
      this.absoluteJump(
        memIO.read[0x2](interruptOffset), // offset
        memIO.read[0x2](interruptOffset + 0x2), // segment
      );
    } else {
      handler.fn();
    }

    return true;
  }

  /**
   * Repeat without additional checks
   *
   * @todo
   *  Add service interrupts!
   */
  private rep(operand: VoidFunction): void {
    const { registers } = this;
    const { ip: cachedIP } = registers;
    let counter = registers.cx;

    while (counter !== 0) {
      registers.ip = cachedIP;
      operand();
      --counter;
    }

    registers.cx = 0x0;
  }

  /**
   *Repeat with ZF check
   */
  private repZF(operand: VoidFunction, zfVal: number): void {
    const { registers } = this;
    const { ip: cachedIP } = registers;
    let counter = registers.cx;

    while (counter !== 0) {
      registers.ip = cachedIP;
      operand();
      --counter;

      if (registers.status.zf === zfVal) {
        break;
      }
    }

    registers.cx = counter;
  }

  /**
   * Exec CPU
   */
  exec(maxTime: number): void {
    if (!this.clock) {
      return;
    }

    const { registers, prefixes, instructionStartAddress } = this;
    const tick = () => {
      /** Tick */
      if (this.pause) {
        return;
      }

      /** Used for exception repeat instruction */
      instructionStartAddress.segment = registers.cs;
      instructionStartAddress.offset = registers.ip;

      /** Decode prefix */
      let opcode = this.fetchOpcode(0x1, true, true);
      if (X87.isX87Opcode(opcode)) {
        this.x87.tick(opcode);
        return;
      }

      for (let i = 0x0; i < 0x4; ++i) {
        const prefix = X86_PREFIXES[opcode];
        if (prefix === undefined) {
          break;
        }

        /** Segment registers have object instead of opcode */
        const segmentOverride = (<X86SegmentPrefix>prefix)._sr;
        if (segmentOverride) {
          prefixes[X86_PREFIX_LABEL_MAP[0x1]] = prefix;
        } else {
          prefixes[X86_PREFIX_LABEL_MAP[<number>prefix]] = opcode;
        }

        /** Load next opcode */
        opcode = this.fetchOpcode(0x1, true, true);
        prefixes.empty = false;
      }

      /** 0F prefix opcodes to 2-byte opcodes */
      if (opcode === 0x0f) {
        opcode = (opcode << 0x8) | this.fetchOpcode(0x1, true, true);
      }

      /** Decode opcode */
      const operand = this.opcodes[opcode];
      if (!operand) {
        this.logger.error(
          `Unknown opcode 0x${opcode.toString(16).toUpperCase()}! Excuting fault!`,
        );
        this.interrupt(X86Interrupt.raise.invalidOpcode());
        return;
      }

      /**
       * REP - Do something with operand, reset opcode prefix
       *
       * @see {@link https://c9x.me/x86/html/file_module_x86_id_279.html}
       */
      const repz = prefixes.instruction === 0xf3;
      const repnz = prefixes.instruction === 0xf2;

      if (repz || repnz) {
        switch (opcode) {
          /** INS, MOVS, OUTS, LODS, STOS */
          case 0x6c:
          case 0x6d:
          case 0xa4:
          case 0xa5:
          case 0x6e:
          case 0x6f:
          case 0xac:
          case 0xad:
          case 0xaa:
          case 0xab:
            this.rep(operand);
            break;

          /** CMPS, SCAS */
          case 0xa6:
          case 0xa7:
          case 0xae:
          case 0xaf:
            this.repZF(operand, repnz ? 1 : 0);
            break;

          default:
            throw new Error('Unknown REP instruction!');
        }
      } else {
        operand();
      }

      /** Reset opcode */
      if (!prefixes.empty) {
        prefixes.clear();
      }
    };

    /** Exec CPU */
    const { devices } = this;
    (<PIT>devices.pit).tick();

    if (maxTime) {
      const maxEndTime = performance.now() + maxTime;
      for (; performance.now() <= maxEndTime && this.clock; ) {
        tick();
      }
    } else {
      while (this.clock) {
        tick();
      }
    }
  }

  /**
   * Appends constant to ip, handles segment overflow
   */
  incrementIP(size: number): void {
    const { registers } = this;

    registers.ip += size;

    // increment CS if overflows
    if (registers.ip > 0xffff) {
      registers.ip = toUnsignedNumber(this.registers.ip, 0x2);
      registers.cs += 0x1000;
    }
  }

  /**
   * Get next opcode
   */
  fetchOpcode(
    size: X86BitsMode = 0x1,
    incrementIP: boolean = true,
    ignorePrefix: boolean = false,
  ): number {
    if (!ignorePrefix && this.prefixes.operandSize === 0x66) {
      size = 0x4;
    }

    const mapper = this.memIO.read[size];
    if (mapper) {
      const opcode = mapper(this.physicalIP);
      if (incrementIP) {
        this.incrementIP(size);
      }

      return opcode;
    }

    this.halt('Unknown opcode size!');
    return null;
  }

  /**
   * Performs jumps replacing segment and ip register
   */
  absoluteJump(ip: number, cs: number): void {
    Object.assign(this.registers, {
      ip,
      cs,
    });
  }

  /**
   * Fetch opcodes and jump to address
   * relative to ip register. If rel < 0
   * sub 1B instruction size
   */
  relativeJump(bits: X86BitsMode, relative?: number): void {
    const { registers } = this;

    relative = relative ?? this.fetchOpcode(bits);

    /** 1B call instruction size */
    relative = getSignedNumber(relative, bits);
    registers.ip += relative;

    /**
     * If overflows its absolute, truncate value
     * dont know why, its undocummented
     */
    if (registers.ip > BINARY_MASKS[0x2] + 1) {
      registers.ip &= 0xff;
    }
  }

  /**
   * Increment relative to DF register flag, used in file loaders
   *
   * @see
   *  Only for 16bit registers!
   */
  dfIncrement(delta: number = 0x1, ...args: X86RegName[]): void {
    const { registers } = this;
    const dir = registers.status.df ? -delta : delta;

    for (let i = 0; i < args.length; ++i) {
      registers[<string>args[i]] = toUnsignedNumber(
        registers[<string>args[i]] + dir,
        0x2,
      );
    }
  }

  /**
   * Parse RM mode byte:
   *
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/lecture.html}
   * @see {@link https://en.wikibooks.org/wiki/X86_Assembly/Machine_Language_Conversion}
   * @see
   *  {@link https://software.intel.com/sites/default/files/managed/39/c5/325462-sdm-vol-1-2abcd-3abcd.pdf}
   *  Table 2-1. 16-Bit Addressing Forms with the ModR/M Byte
   */
  parseRmByte(
    regCallback: X86RegRMCallback,
    memCallback: X86MemRMCallback,
    mode: X86BitsMode,
    segRegister: X86RegName = this.segmentReg,
  ) {
    const modeRegs = X86_REGISTERS[mode];
    const byte = RMByte.ofByte(this.fetchOpcode(0x1, true, true));

    // Register
    if (byte.mod === 0x3) {
      regCallback(modeRegs ? modeRegs[byte.rm] : null, byte.reg, byte, mode);
    } else if (memCallback) {
      // Address
      let address = 0,
        displacement = 0;

      // indirect
      if (!byte.mod && byte.rm === 0x6) {
        address = this.fetchOpcode(0x2);
      } else {
        // Eight-bit displacement, sign-extended to 16 bits
        if (byte.mod === 0x1) {
          displacement = getSignedNumber(this.fetchOpcode(0x1), 0x1);
        } else if (byte.mod === 0x2) {
          displacement = getSignedNumber(this.fetchOpcode(0x2), 0x2);
        }

        // Calc address
        const { registers } = this;
        switch (byte.rm) {
          case 0x0:
            address = registers.bx + registers.si + displacement;
            break;
          case 0x1:
            address = registers.bx + registers.di + displacement;
            break;
          case 0x2:
            address = registers.bp + registers.si + displacement;
            break;
          case 0x3:
            address = registers.bp + registers.di + displacement;
            break;

          case 0x4:
            address = registers.si + displacement;
            break;

          case 0x5:
            address = registers.di + displacement;
            break;

          case 0x6:
            address = registers.bp + displacement;
            break;

          case 0x7:
            address = registers.bx + displacement;
            break;

          default:
            this.logger.error('Unknown RM byte address!');
        }

        // Seg register ss is set with 0x2, 0x3, 0x6 opcodes
        if (byte.rm >= 0x2 && !(0x6 % byte.rm) && segRegister === 'ds') {
          segRegister = 'ss';
        }
      }

      if (segRegister) {
        address = this.getMemAddress(segRegister, address);
      }

      // Callback and address calc
      memCallback(
        // Only effective address
        address,
        modeRegs ? modeRegs[byte.reg] : null,
        byte,
        mode,
      );
    }
  }

  /**
   * Rotate bits to left with carry flag
   *
   * @see {@link https://github.com/NeatMonster/Intel8086/blob/master/src/fr/neatmonster/ibmpc/Intel8086.java#L4200}
   */
  rcl(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const mask = BINARY_MASKS[bits];
    const {
      registers: { status },
    } = this;

    for (let i = times; i > 0; --i) {
      num <<= 0x1;
      num |= status.cf;
      status.cf = (num >> 8) & 0x1;
      num &= mask;
    }

    status.of = times === 1 ? getMSbit(num, bits) ^ status.cf : 0;

    return num;
  }

  /**
   * Shift bits to right with carry flag
   *
   * @see {@link https://github.com/NeatMonster/Intel8086/blob/master/src/fr/neatmonster/ibmpc/Intel8086.java#L4200}
   */
  shr(num: number, times: number, bits: X86BitsMode = 0x1): number {
    if (!times) {
      return num;
    }

    const { alu, registers } = this;
    const { status } = registers;
    const result = (num >>> times) & X86_BINARY_MASKS[bits];

    status.cf = (num >> (times - 1)) & 1;
    status.of = getMSbit(num, bits) & 0x1;
    alu.setZSPFlags(result, bits);

    return result;
  }

  /**
   * Shift bits to left with carry flag
   */
  shl(num: number, times: number, bits: X86BitsMode = 0x1): number {
    const { alu, registers } = this;
    const { status } = registers;
    const mask = BINARY_MASKS[bits];

    for (; times > 0; --times) {
      status.cf = getMSbit(num, bits);
      num <<= 0x1;
      num &= mask;
    }

    status.zf = +(num === 0);
    status.of = getMSbit(num) ^ status.cf;
    alu.setZSPFlags(num, bits);

    return num;
  }

  /**
   * Fast bit rotate
   */
  rol(num: number, times: number, bits: X86BitsMode = 0x1): number {
    if (!times) {
      return num;
    }

    const { status } = this.registers;
    const byteSize = bits * 8;

    if (times > 0) {
      // rol
      let tCf = 0;
      for (let i = (times % byteSize) - 1; i >= 0; --i) {
        tCf = getMSbit(num, bits);
        num = (num << 1) + tCf;
      }

      status.cf = num & 0x1;
      status.of = times === 1 ? getMSbit(num, bits) ^ status.cf : 0;
    } else {
      let tCf = 0;
      for (let i = -times % byteSize; i >= 0; --i) {
        tCf = num & 0x1;
        num = (num >> 1) + (tCf << byteSize);
      }

      status.cf = getMSbit(num, bits);
      status.of = times === -1 ? getMSbit(num, bits) ^ getMSbit(num, bits) : 0;
    }

    status.zf = +(num === 0);

    return num;
  }

  freeze() {
    this.pause = true;
  }

  /**
   * Shut down emulator, if dump is enabled show all registers into console
   */
  halt(message?: string, dump?: boolean): void {
    if (!this.clock) {
      this.logger.warn('CPU is already turned off');
    } else {
      this.clock = false;

      R.forEachObjIndexed(cpuDevice => cpuDevice.halt(), this.devices);

      /** Optional args */
      if (message) {
        this.logger.warn(message);
      }

      if (dump) {
        this.debugDumpRegisters();
        this.logger.warn(this.mem);
      }

      /** Next instruction */
      this.logger.info(`Halt! Next instruction ${this.fetchOpcode(0x2).toString(16)}`);
      this.config.handle?.onHalt?.();
    }
  }
}
