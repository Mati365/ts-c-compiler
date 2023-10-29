import { replaceNthByte, extractNthByte } from '@ts-c/core';

import { X86UuidAbstractDevice } from '../../parts/X86AbstractDevice';

import { X86CPU } from '../../X86CPU';
import {
  CountdownTimer,
  TimerControlByte,
  TimerAccessMode,
} from './CountdownTimer';

import { SpeakerTimer } from './SpeakerTimer';

/**
 * Real-Time Clock
 *
 * @see {@link http://www.ic.unicamp.br/~celio/mc404s102/pcspeaker/InternalSpeaker.htm}
 * @see {@link https://web.archive.org/web/20140307023908/http://fly.srk.fer.hr/GDM/articles/sndmus/speaker1.html}
 * @see {@link https://wiki.osdev.org/Programmable_Interval_Timer}
 */
export class PIT extends X86UuidAbstractDevice<X86CPU> {
  static readonly uuid = 'pit';

  private timers: { [offset: number]: CountdownTimer } = {
    0x0: new CountdownTimer(),
    0x1: new CountdownTimer(),
    0x2: new SpeakerTimer(),
  };

  get speakerTimer(): SpeakerTimer {
    return this.timers[0x2] as SpeakerTimer;
  }

  tick() {
    const { timers } = this;

    timers[0x0].check(this);
    timers[0x1].check(this);
    timers[0x2].check(this);
  }

  /**
   * Reads current value from nth counter
   */
  readChannelCounterByte(index: number): number {
    const timer = this.timers[index];
    const { accessMode } = timer.controlByte;
    const value = timer.latched ? timer.latchValue : timer.getValue();

    let byte = 0;
    switch (accessMode) {
      case TimerAccessMode.ACCESS_LO_BYTE_ONLY:
        byte = extractNthByte(0x0, value);
        timer.latched = 0;
        break;

      case TimerAccessMode.ACCESS_HI_BYTE_ONLY:
        byte = extractNthByte(0x1, value);
        timer.latched = 0;
        break;

      case TimerAccessMode.LATCH_COUNT_VALUE:
      case TimerAccessMode.ACCESS_LO_HI_BYTE:
        byte = extractNthByte(timer.accessByteOffset, value);

        timer.accessByteOffset--;
        if (timer.accessByteOffset < 0) {
          timer.accessByteOffset += 2;
          timer.latched = 0;
        }
        break;

      default:
        console.warn('PIT: unknown timer accessMode!');
    }

    return byte;
  }

  /**
   * Writes counter value byte into timer
   */
  writeChannelCounterByte(index: number, byte: number) {
    const timer = this.timers[index];
    const { accessMode } = timer.controlByte;
    let byteOffset = 0x0;

    switch (accessMode) {
      case TimerAccessMode.ACCESS_LO_BYTE_ONLY:
        byteOffset = 0x0;
        break;

      case TimerAccessMode.ACCESS_HI_BYTE_ONLY:
        byteOffset = 0x1;
        break;

      case TimerAccessMode.ACCESS_LO_HI_BYTE:
        byteOffset = timer.accessByteOffset;
        timer.accessByteOffset = (timer.accessByteOffset + 1) % 2;
        break;

      default:
        console.warn('PIT: unknown timer accessMode!');
    }

    if (accessMode !== TimerAccessMode.LATCH_COUNT_VALUE) {
      timer.countdown = replaceNthByte(byteOffset, timer.countdown, byte);
    }
  }

  /**
   * Boot device
   */
  init() {
    this.irq = 0x0;
    this.ports = {
      /* recat/write timer countdown value */
      0x40: {
        set: byte => this.writeChannelCounterByte(0x0, byte),
        get: () => this.readChannelCounterByte(0x0),
      },
      0x41: {
        set: byte => this.writeChannelCounterByte(0x1, byte),
        get: () => this.readChannelCounterByte(0x1),
      },
      0x42: {
        set: byte => this.writeChannelCounterByte(0x2, byte),
        get: () => this.readChannelCounterByte(0x2),
      },

      /* tell timer that should it will receive data */
      0x43: {
        set: data => {
          const controlByte = new TimerControlByte(data);

          // find matching timer
          const timer = this.timers[controlByte.channel];
          timer.reset();
          timer.controlByte = controlByte;

          if (controlByte.accessMode === TimerAccessMode.LATCH_COUNT_VALUE) {
            timer.latchValue = timer.getValue();
            timer.latched = 2;
            timer.accessByteOffset = 0x1;
          }
        },
      },
    };
  }
}
