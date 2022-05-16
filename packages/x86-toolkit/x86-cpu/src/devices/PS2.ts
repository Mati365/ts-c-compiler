import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';

import {X86CPU} from '../X86CPU';
import {uuidX86Device} from '../types/X86AbstractDevice';

export class PS2Status extends UnionStruct {
  @bits(0) outputBufferStatus: number;
  @bits(1) inputBufferStatus: number;
  @bits(2) systemFlag: number;
  @bits(3) command: number;
  @bits(6) timeoutError: number;
  @bits(7) parityError: number;
}

export class PS2Configuration extends UnionStruct {
  @bits(0) firstPortInterrupt: number;
  @bits(1) secondPortInterrupt: number;
  @bits(2) systemFlag: number;
  @bits(3) shouldBeZero: number;
  @bits(4) firstPortClock: number;
  @bits(5) secondPortClock: number;
  @bits(6) firstPortTranslation: number;
}

/**
 * @todo
 *  Add PS2 support!
 *
 * @export
 * @class PS2
 * @extends {uuidX86Device<X86CPU>('ps2')}
 */
export class PS2 extends uuidX86Device<X86CPU>('ps2') {
  init() {}
}
