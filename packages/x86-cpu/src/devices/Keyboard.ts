import { UnionStruct, bits } from '@ts-c/core';
import { X86CPU } from '../X86CPU';
import { PIT } from './PIT/PIT';

import { X86UuidAbstractDevice } from '../parts/X86AbstractDevice';

export class KeyboardControlReg extends UnionStruct {
  @bits(0) timer2Gate: number;
  @bits(1) speakerGate: number;
  @bits(5) timer2Out: number;
}

/**
 * 8042
 *
 * @see {@link https://github.com/awesomekling/computron/blob/master/hw/keyboard.cpp}
 */
export class Keyboard extends X86UuidAbstractDevice<X86CPU> {
  static readonly uuid = 'keyboard';

  public controlReg: KeyboardControlReg = new KeyboardControlReg();

  /** Add 0x60 speaker etc flags support */
  init() {
    const { controlReg, cpu } = this;
    const { speakerTimer } = <PIT>cpu.devices.pit;

    this.ports = {
      0x61: {
        get: () => controlReg.number,
        set: bitset => {
          const prevEnabledSpeaker = this.isSpeakerEnabled();
          controlReg.number = bitset;
          const enabledSpeaker = this.isSpeakerEnabled();

          if (prevEnabledSpeaker !== enabledSpeaker) {
            if (enabledSpeaker) {
              speakerTimer.initAudio();
            } else {
              speakerTimer.disableAudio();
            }
          }
        },
      },
    };
  }

  /**
   * Speaker flags are stored in keyboard
   */
  isSpeakerEnabled(): boolean {
    const {
      controlReg: { timer2Gate, speakerGate },
    } = this;

    return timer2Gate === 1 && speakerGate === 1;
  }
}
