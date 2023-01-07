import { VirtualMemBlockDriver } from '../memory/VirtualMemBlockDriver';
import { VGA } from '../devices/Video/VGA';
import { X86AbstractCPU } from './X86AbstractCPU';

/**
 * Simple RAM manager
 *
 * @todo
 * Add VGA mem maps
 */
export class X86RAM<T extends X86AbstractCPU> extends VirtualMemBlockDriver {
  protected cpu: T;
  protected vga: VGA;

  constructor(cpu: T, device: Uint8Array) {
    super(device);

    this.cpu = cpu;
    this.vga = <VGA>cpu.devices.vga;
  }

  /**
   * Writes single byte to mapped memory
   */
  writeByte(address: number, value: number): number {
    const { vga } = this;
    const result: number = vga.writeByte(address, value);
    if (result !== null) {
      return result;
    }

    return super.writeByte(address, value);
  }

  /**
   * Reads single byte from mapped memory
   */
  readByte(address: number): number {
    const { vga } = this;
    const result: number = vga.readByte(address);
    if (result !== null) {
      return result;
    }

    return super.readByte(address);
  }
}
