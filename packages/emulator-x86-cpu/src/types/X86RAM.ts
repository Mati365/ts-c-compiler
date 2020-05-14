import {VirtualMemBlockDriver} from '../memory/VirtualMemBlockDriver';

/**
 * Simple RAM manager
 *
 * @todo
 * Add VGA mem maps
 *
 *
 * @export
 * @class X86RAM
 * @extends {VirtualMemBlockDriver}
 * @template T
 */
export class X86RAM<T> extends VirtualMemBlockDriver {
  protected cpu: T;

  constructor(cpu: T, device: Buffer) {
    super(device);
    this.cpu = cpu;
  }
}
