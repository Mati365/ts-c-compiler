import {X86_REGISTERS} from './constants/x86';

import {X86BitsMode} from './types';
import {X86Unit} from './X86Unit';
import {X86CPU} from './X86CPU';

/**
 * Basic CPU ports communication support
 *
 * @export
 * @class X86IO
 * @extends {X86Unit}
 */
export class X86IO extends X86Unit {
  /* eslint-disable class-methods-use-this */
  /**
   * Initialize CPU IO ports handlers opcodes
   *
   * @protected
   * @param {X86CPU} cpu
   * @memberof X86IO
   */
  protected init(cpu: X86CPU): void {
    const {registers, opcodes, ports} = cpu;

    Object.assign(opcodes, {
      /** IN AL, 8bits  */ 0xE4: (bits = 0x1, port: number) => {
        if (!port)
          port = cpu.fetchOpcode(0x1);

        const portHandler = ports[port];
        registers[<string> X86_REGISTERS[bits][0x0]] = portHandler ? portHandler.get(bits) : 0;
      },
      /** IN AX, 16bits */ 0xE5: () => opcodes[0xE4](0x2),

      /** IN AL, port[DX] */ 0xEC: () => opcodes[0xE4](0x1, registers.dx),
      /** IN AL, port[DX] */ 0xED: () => opcodes[0xE4](0x2, registers.dx),

      /** OUT 8bits, al  */ 0xE6: (bits: X86BitsMode = 0x1, port: number) => {
        port = port ?? cpu.fetchOpcode(0x1);
        if (port in ports)
          ports[port].set(registers[<string> X86_REGISTERS[bits][0x0]], bits);
      },
      /** OUT 8bits, al     */ 0xE7: () => opcodes[0xE6](0x2),
      /** OUT port[DX], al  */ 0xEE: () => opcodes[0xE6](0x1, registers.dx),
      /** OUT port[DX], ah  */ 0xEF: () => opcodes[0xE6](0x2, registers.dx),
    });
  }
  /* eslint-enable class-methods-use-this */
}
