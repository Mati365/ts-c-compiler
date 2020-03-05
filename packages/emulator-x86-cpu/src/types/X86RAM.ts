type RAMBufferReaders = {
  0x1: Buffer['readUInt8'],
  0x2: Buffer['readUInt16LE'],
  0x4: Buffer['readUInt32LE'],
};

type RAMBufferWriters = {
  0x1: Buffer['writeUInt8'],
  0x2: Buffer['writeUInt16LE'],
  0x4: Buffer['writeUInt32LE'],
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
  }
}
