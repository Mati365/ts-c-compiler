
import {replaceNthByte, extractNthByte} from '@compiler/core/utils/extractNthByte';
import {uuidX86Device} from '../../types/X86AbstractDevice';

import {X86CPU} from '../../X86CPU';
import {CountdownTimer, TimerControlByte, TimerAccessMode} from './CountdownTimer';
import {SpeakerTimer} from './SpeakerTimer';

/*
Octave 0    1    2    3    4    5    6    7
  Note
   C     16   33   65  131  262  523 1046 2093
   C#    17   35   69  139  277  554 1109 2217
   D     18   37   73  147  294  587 1175 2349
   D#    19   39   78  155  311  622 1244 2489
   E     21   41   82  165  330  659 1328 2637
   F     22   44   87  175  349  698 1397 2794
   F#    23   46   92  185  370  740 1480 2960
   G     24   49   98  196  392  784 1568 3136
   G#    26   52  104  208  415  831 1661 3322
   A     27   55  110  220  440  880 1760 3520
   A#    29   58  116  233  466  932 1865 3729
   B     31   62  123  245  494  988 1975 3951
*/
/**
 * Real-Time Clock
 *
 * @see {@link http://www.ic.unicamp.br/~celio/mc404s102/pcspeaker/InternalSpeaker.htm}
 * @see {@link https://web.archive.org/web/20140307023908/http://fly.srk.fer.hr/GDM/articles/sndmus/speaker1.html}
 * @see {@link https://wiki.osdev.org/Programmable_Interval_Timer}
 *
 * @class PIT
 * @extends {Device}
 */
export class PIT extends uuidX86Device<X86CPU>('pit') {
  private timers: {[offset: number]: CountdownTimer} = {
    0x0: new CountdownTimer,
    0x1: new CountdownTimer,
    0x2: new SpeakerTimer,
  };

  get speakerTimer(): SpeakerTimer {
    return <SpeakerTimer> this.timers[0x2];
  }

  tick() {
    const {timers} = this;

    timers[0x0].check(this);
    timers[0x1].check(this);
    timers[0x2].check(this);
  }

  /**
   * Reads current value from nth counter
   *
   * @param {number} index
   * @returns {number}
   * @memberof PIT
   */
  readChannelCounterByte(index: number): number {
    const timer = this.timers[index];
    const {accessMode} = timer.controlByte;

    let byte = 0;
    switch (accessMode) {
      case TimerAccessMode.ACCESS_LO_BYTE_ONLY:
        byte = extractNthByte(0x0, timer.getValue());
        break;

      case TimerAccessMode.ACCESS_HI_BYTE_ONLY:
        byte = extractNthByte(0x1, timer.getValue());
        break;

      case TimerAccessMode.ACCESS_LATCHED_LI_HI_BYTE:
      case TimerAccessMode.ACCESS_LO_HI_BYTE:
        if (accessMode === TimerAccessMode.ACCESS_LATCHED_LI_HI_BYTE)
          byte = extractNthByte(timer.accessByteOffset, timer.latchValue);
        else
          byte = extractNthByte(timer.accessByteOffset, timer.getValue());

        timer.accessByteOffset--;
        if (timer.accessByteOffset < 0)
          timer.accessByteOffset += 2;
        break;

      default:
        console.warn('PIT: unknown timer accessMode!');
    }

    return byte;
  }

  /**
   * Writes counter value byte into timer
   *
   * @param {number} index
   * @param {number} byte
   * @memberof PIT
   */
  writeChannelCounterByte(index: number, byte: number) {
    const timer = this.timers[index];
    const {accessMode} = timer.controlByte;
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

    if (accessMode !== TimerAccessMode.ACCESS_LATCHED_LI_HI_BYTE)
      timer.countdown = replaceNthByte(byteOffset, timer.countdown, byte);
  }

  /**
   * Boot device
   *
   * @memberof PIT
   */
  init() {
    this.irq = 0x0;
    this.ports = {
      /* recat/write timer countdown value */
      0x40: {
        set: (byte) => this.writeChannelCounterByte(0x0, byte),
        get: () => this.readChannelCounterByte(0x0),
      },
      0x41: {
        set: (byte) => this.writeChannelCounterByte(0x1, byte),
        get: () => this.readChannelCounterByte(0x1),
      },
      0x42: {
        set: (byte) => this.writeChannelCounterByte(0x2, byte),
        get: () => this.readChannelCounterByte(0x2),
      },

      /* tell timer that should it will receive data */
      0x43: {
        set: (data) => {
          const controlByte = new TimerControlByte(data);

          // find matching timer
          const timer = this.timers[controlByte.channel];
          timer.reset();
          timer.controlByte = controlByte;

          if (controlByte.accessMode === TimerAccessMode.ACCESS_LATCHED_LI_HI_BYTE) {
            timer.latchValue = timer.getValue();
            timer.accessByteOffset = 0x1;
          }
        },
      },
    };
  }
}
