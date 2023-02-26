import { Buffer } from 'buffer';

import {
  fromIEEE754Double,
  fromIEEE754Single,
  fromIEEE754Extended,
  toIEEE754Double,
  toIEEE754Single,
  toIEEE754Extended,
} from '@compiler/core/utils/IEEE754';

import { X86BitsMode } from '../parts/X86Regs';
import { X86AbstractCPU } from '../parts/X86AbstractCPU';
import { ByteMemRegionAccessor } from './MemoryRegion';

type MemReader = (offset: number) => number;
type MemWriter = (value: number, offset: number) => number;

type MemBufferReaders = {
  0x1: MemReader;
  0x2: MemReader;
  0x4: MemReader;
  0x8: (offset: number) => number[];
};

type MemBufferWriters = {
  0x1: MemWriter;
  0x2: MemWriter;
  0x4: MemWriter;
  0x8: (value: number[], offset: number) => number;
};

type IEEE754MemIO = {
  read: {
    single: MemReader;
    double: MemReader;
    extended: MemReader;
  };
  write: {
    single: MemWriter;
    double: MemWriter;
    extended: MemWriter;
  };
};

/**
 * Simple helper that helps with reading virutal memory
 */
export class VirtualMemBlockDriver implements ByteMemRegionAccessor {
  public device: Uint8Array;
  public read: MemBufferReaders;
  public write: MemBufferWriters;
  public ieee754: IEEE754MemIO;

  constructor(device: Uint8Array) {
    this.device = device;
    this.read = {
      /** 8bit  */ 0x1: address => this.readNumber(address, 0x1),
      /** 16bit */ 0x2: address => this.readNumber(address, 0x2),
      /** 32bit */ 0x4: address => this.readNumber(address, 0x4),
      /** 64bit */ 0x8: (address: number) => [
        this.readNumber(address, 0x4),
        this.readNumber(address + 0x4, 0x4) << 32,
      ],
    };

    this.write = {
      /** 8bit  */ 0x1: (value, address) =>
        this.writeNumber(address, value, 0x1),
      /** 16bit */ 0x2: (value, address) =>
        this.writeNumber(address, value, 0x2),
      /** 32bit */ 0x4: (value, address) =>
        this.writeNumber(address, value, 0x4),
      /** 64bit */ 0x8: (value: number[], address: number) => {
        this.writeNumber(value[0], address, 0x4);
        this.writeNumber(value[1] >> 32, address + 0x4, 0x4);
        return address;
      },
    };

    /** FLOATING POINT */
    this.ieee754 = {
      read: {
        single: address => fromIEEE754Single(this.readBytesLE(address, 0x4)),
        double: address => fromIEEE754Double(this.readBytesLE(address, 0x8)),
        extended: address =>
          fromIEEE754Extended(this.readBytesLE(address, 0xa)),
      },

      write: {
        single: (value, address) =>
          this.writeBytesLE(address, toIEEE754Single(value)),
        double: (value, address) =>
          this.writeBytesLE(address, toIEEE754Double(value)),
        extended: (value, address) =>
          this.writeBytesLE(address, toIEEE754Extended(value)),
      },
    };
  }

  /**
   * Allocates empty mem block
   */
  static alloc(bytes: number, fill: number = 0x0): VirtualMemBlockDriver {
    return new VirtualMemBlockDriver(Buffer.alloc(bytes, fill));
  }

  /**
   * Saves single byte in memory
   */
  writeByte(address: number, value: number): number {
    this.device[address] = value;
    return 1;
  }

  /**
   * Reads single byte in memory
   */
  readByte(address: number): number {
    return this.device[address];
  }

  /**
   * Writes single byte to memory
   *
   * @see
   *  It is easy to override in extend classes to simulate virtual memory!
   */
  writeNumber(address: number, value: number, bits: X86BitsMode = 0x1): number {
    let shift = 0;
    for (let i = 0; i < bits; ++i) {
      this.writeByte(address + i, (value >>> shift) & 0xff);
      shift += 8;
    }

    return bits;
  }

  /**
   * Reads single byte from memory
   *
   * @see
   *  It is easy to override in extend classes to simulate virtual memory!
   */
  readNumber(address: number, bits: X86BitsMode = 0x1): number {
    let number = 0;
    let shift = 0;

    for (let i = 0; i < bits; ++i) {
      number |= this.readByte(address + i) << shift;
      shift += 8;
    }

    return number;
  }

  /**
   * Fetches nth bytes in little endian
   */
  readBytesLE(address: number, count: number): number[] {
    const bytes: number[] = new Array<number>(count);
    const endOffset = address + count - 1;

    for (let i = 0; i < count; ++i) {
      bytes[i] = this.readNumber(endOffset - i, 0x1);
    }

    return bytes;
  }

  /**
   * Writes nth bytes into memory reversed, little endian
   */
  writeBytesLE(address: number, bytes: number[]): number {
    const { length: count } = bytes;
    const endOffset = address + count - 1;

    for (let i = 0; i < count; ++i) {
      this.writeNumber(endOffset - i, bytes[i], 0x1);
    }

    return address;
  }

  /**
   * Writes nth bytes into memory, big endian
   */
  writeBytesBE(address: number, bytes: number[]): number {
    const { length: count } = bytes;

    for (let i = 0; i < count; ++i) {
      this.writeNumber(address + i, bytes[i], 0x1);
    }

    return address;
  }

  /**
   * Loads int from mem address
   */
  readSignedInt(address: number, mode: X86BitsMode): number {
    return X86AbstractCPU.getSignedNumber(this.readNumber(address, mode), mode);
  }
}
