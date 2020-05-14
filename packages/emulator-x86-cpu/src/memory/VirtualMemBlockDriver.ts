import {
  fromIEEE754Double,
  fromIEEE754Single,
  fromIEEE754Extended,
  toIEEE754Double,
  toIEEE754Single,
  toIEEE754Extended,
} from '@compiler/core/utils/IEEE754';

import {X86BitsMode} from '../types/X86Regs';
import {X86AbstractCPU} from '../types/X86AbstractCPU';

type MemReader = (offset: number) => number;
type MemWriter = (value: number, offset: number) => number;

type MemBufferReaders = {
  0x1: MemReader,
  0x2: MemReader,
  0x4: MemReader,
  0x8: (offset: number) => number[],
};

type MemBufferWriters = {
  0x1: MemWriter,
  0x2: MemWriter,
  0x4: MemWriter,
  0x8: (value: number[], offset: number) => number,
};

type IEEE754MemIO = {
  read: {
    single: MemReader,
    double: MemReader,
    extended: MemReader,
  },
  write: {
    single: MemWriter,
    double: MemWriter,
    extended: MemWriter,
  },
};

/**
 * Simple helper that helps with reading virutal memory
 *
 * @export
 * @class VirtualMemBlockDriver
 */
export class VirtualMemBlockDriver {
  public device: Buffer;
  public read: MemBufferReaders;
  public write: MemBufferWriters;
  public ieee754: IEEE754MemIO;

  constructor(device: Buffer) {
    this.device = device;

    this.read = {
      /** 8bit  */ 0x1: (address) => this.readUInt(address, 0x1),
      /** 16bit */ 0x2: (address) => this.readUInt(address, 0x2),
      /** 32bit */ 0x4: (address) => this.readUInt(address, 0x4),
      /** 64bit */ 0x8: (address: number) => [
        this.readUInt(address, 0x4),
        this.readUInt(address + 0x4, 0x4) << 32,
      ],
    };

    this.write = {
      /** 8bit  */ 0x1: (value, address) => this.writeUInt(address, value, 0x1),
      /** 16bit */ 0x2: (value, address) => this.writeUInt(address, value, 0x2),
      /** 32bit */ 0x4: (value, address) => this.writeUInt(address, value, 0x4),
      /** 64bit */ 0x8: (value: number[], address: number) => {
        device.writeUInt32LE(value[0], address);
        device.writeUInt32LE(value[1] >> 32, address + 0x4);
        return address;
      },
    };

    /** FLOATING POINT */
    this.ieee754 = {
      read: {
        single: (address) => fromIEEE754Single(this.readBytesLE(address, 0x4)),
        double: (address) => fromIEEE754Double(this.readBytesLE(address, 0x8)),
        extended: (address) => fromIEEE754Extended(this.readBytesLE(address, 0xA)),
      },

      write: {
        single: (value, address) => this.writeBytesLE(address, toIEEE754Single(value)),
        double: (value, address) => this.writeBytesLE(address, toIEEE754Double(value)),
        extended: (value, address) => this.writeBytesLE(address, toIEEE754Extended(value)),
      },
    };
  }

  /**
   * Writes single byte to memory
   *
   * @see
   *  It is easy to override in extend classes to simulate virtual memory!
   *
   * @param {number} address
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof VirtualMemBlockDriver
   */
  writeUInt(address: number, value: number, bits: X86BitsMode = 0x1): number {
    const {device} = this;

    switch (bits) {
      case 0x1: return device.writeUInt8(value, address);
      case 0x2: return device.writeUInt16LE(value, address);
      case 0x4: return device.writeUInt32LE(value, address);
      default:
        throw new Error('Invalid mem access!');
    }
  }

  /**
   * Reads single byte from memory
   *
   * @see
   *  It is easy to override in extend classes to simulate virtual memory!
   *
   * @param {number} address
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof VirtualMemBlockDriver
   */
  readUInt(address: number, bits: X86BitsMode = 0x1): number {
    const {device} = this;

    switch (bits) {
      case 0x1: return device.readUInt8(address);
      case 0x2: return device.readUInt16LE(address);
      case 0x4: return device.readUInt32LE(address);
      default:
        throw new Error('Invalid mem access!');
    }
  }

  /**
   * Fetches nth bytes in little endian
   *
   * @param {number} address
   * @param {number} count
   * @returns {number[]} bytes
   * @memberof X86RAM
   */
  readBytesLE(address: number, count: number): number[] {
    const bytes: number[] = new Array<number>(count);
    const endOffset = address + count - 1;

    for (let i = 0; i < count; ++i)
      bytes[i] = this.readUInt(endOffset - i, 0x1);

    return bytes;
  }

  /**
   * Writes nth bytes into memory reversed, little endian
   *
   * @param {number} address
   * @param {number[]} bytes
   * @returns {number} address
   * @memberof X86RAM
   */
  writeBytesLE(address: number, bytes: number[]): number {
    const {length: count} = bytes;
    const endOffset = address + count - 1;

    for (let i = 0; i < count; ++i)
      this.writeUInt(bytes[i], endOffset - i, 0x1);

    return address;
  }

  /**
   * Writes nth bytes into memory, big endian
   *
   * @param {number} address
   * @param {number[]} bytes
   * @returns {number} address
   * @memberof X86RAM
   */
  writeBytesBE(address: number, bytes: number[]): number {
    const {length: count} = bytes;

    for (let i = 0; i < count; ++i)
      this.writeUInt(bytes[i], i, 0x1);

    return address;
  }

  /**
   * Loads int from mem address
   *
   * @param {number} address
   * @param {X86BitsMode} mode
   * @returns {number}
   * @memberof X86RAM
   */
  readSignedInt(address: number, mode: X86BitsMode): number {
    return X86AbstractCPU.getSignedNumber(
      this.readUInt(address, mode),
      mode,
    );
  }
}
