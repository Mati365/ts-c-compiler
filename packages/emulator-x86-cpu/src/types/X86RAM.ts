import {
  fromIEEE754Double,
  fromIEEE754Single,
  fromIEEE754Extended,
  toIEEE754Double,
  toIEEE754Single,
  toIEEE754Extended,
} from '@compiler/core/utils/IEEE754';

type RAMReader = (offset: number) => number;
type RAMWriter = (value: number, offset: number) => number;

type RAMBufferReaders = {
  0x1: RAMReader,
  0x2: RAMReader,
  0x4: RAMReader,
};

type RAMBufferWriters = {
  0x1: RAMWriter,
  0x2: RAMWriter,
  0x4: RAMWriter,
};

type IEEE754RamIO = {
  read: {
    single: RAMReader,
    double: RAMReader,
    extended: RAMReader,
  },
  write: {
    single: RAMWriter,
    double: RAMWriter,
    extended: RAMWriter,
  },
};

/**
 * Simple RAM manager
 *
 * @todo
 * Implement MMU?
 *
 * @export
 * @class X86RAM
 */
export class X86RAM<T> {
  protected cpu: T;
  public device: Buffer;

  public read: RAMBufferReaders;
  public write: RAMBufferWriters;
  public ieee754: IEEE754RamIO;

  constructor(cpu: T, device: Buffer) {
    this.cpu = cpu;
    this.device = device;

    this.read = {
      /** 8bit  */ 0x1: device.readUInt8.bind(device),
      /** 16bit */ 0x2: device.readUInt16LE.bind(device),
      /** 32bit */ 0x4: device.readUInt32LE.bind(device),
    };

    this.write = {
      /** 8bit  */ 0x1: device.writeUInt8.bind(device),
      /** 16bit */ 0x2: device.writeUInt16LE.bind(device),
      /** 32bit */ 0x4: device.writeUInt32LE.bind(device),
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
   * Fetches nth bytes in little endian
   *
   * @param {number} address
   * @param {number} count
   * @returns {number[]} bytes
   * @memberof X86RAM
   */
  readBytesLE(address: number, count: number): number[] {
    const {device} = this;
    const bytes: number[] = new Array<number>(count);
    const endOffset = address + count - 1;

    for (let i = 0; i < count; ++i)
      bytes[i] = device.readUInt8(endOffset - i);

    return bytes;
  }

  /**
   * Writes nth bytes into memory
   *
   * @param {number} address
   * @param {number[]} bytes
   * @returns {number} address
   * @memberof X86RAM
   */
  writeBytesLE(address: number, bytes: number[]): number {
    const {device} = this;
    const {length: count} = bytes;

    const endOffset = address + count - 1;
    for (let i = 0; i < count; ++i)
      device.writeUInt8(bytes[i], endOffset - i);

    return address;
  }
}
