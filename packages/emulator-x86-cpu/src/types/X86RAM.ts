import {VirtualMemBlockDriver} from '../memory/VirtualMemBlockDriver';
import {VGA} from '../devices/Video/VGA';
import {X86AbstractCPU} from './X86AbstractCPU';
import {X86BitsMode} from './X86Regs';

/**
 * Simple RAM manager
 *
 * @todo
 * Add VGA mem maps
 *
 * @export
 * @class X86RAM
 * @extends {VirtualMemBlockDriver}
 * @template T
 */
export class X86RAM<T extends X86AbstractCPU> extends VirtualMemBlockDriver {
  protected cpu: T;
  protected vga: VGA;

  constructor(cpu: T, device: Buffer) {
    super(device);

    this.cpu = cpu;
    this.vga = <VGA> cpu.devices.vga;
  }

  /**
   * Writes single byte to mapped memory
   *
   * @param {number} address
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof VirtualMemBlockDriver
   */
  writeUInt(address: number, value: number, bits: X86BitsMode = 0x1): number {
    const {vga} = this;
    const result: number = vga.writeUInt(address, value, bits);
    if (result !== null)
      return result;

    return super.writeUInt(address, value, bits);
  }

  /**
   * Reads single byte from mapped memory
   *
   * @param {number} address
   * @param {X86BitsMode} [bits=0x1]
   * @returns {number}
   * @memberof VirtualMemBlockDriver
   */
  readUInt(address: number, bits: X86BitsMode = 0x1): number {
    const {vga} = this;
    const result: number = vga.readUInt(address, bits);
    if (result !== null)
      return result;

    return super.readUInt(address, bits);
  }
}
