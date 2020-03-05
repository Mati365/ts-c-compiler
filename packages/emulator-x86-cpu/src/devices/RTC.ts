import {uuidX86Device} from '../types/X86AbstractDevice';
import {X86CPU} from '../X86CPU';

type ClockTimerConfig = {
  lastReset: number, // time from CPU reset
  speed: number,
};

/**
 * Real-Time Clock
 *
 * @see {@link http://students.mimuw.edu.pl/SO/Projekt03-04/temat3-g4/cmos.html}
 *
 * @export
 * @class RTC
 * @extends {uuidX86Device('rtc')}
 */
export class RTC extends uuidX86Device<X86CPU>('rtc') {
  private index: number = 0;

  private offsets: {[key: number]: () => number} = null;

  private timer: ClockTimerConfig;

  /**
   * Inits clock, sets current date
   *
   * @memberof RTC
   */
  init() {
    const date = new Date;

    this.timer = {
      lastReset: Date.now(),
      speed: 55, /** 55MS tick */
    };

    this.offsets = {
      0x0: date.getSeconds,
      0x2: date.getMinutes,
      0x4: date.getHours,
      0x6: date.getDay,
      0x7: date.getDate,
      0x8: date.getMonth,
      0x9: date.getFullYear,
    };

    /* PORTS */
    this.ports = {
      0x70: {
        set: (index) => {
          this.index = index;
        },
      },
      0x71: {
        get: () => RTC.toBCD(this.offsets[this.index].call(date)),
      },
    };

    /* INTERRUPTS */
    this.attachInterrupts(0x1A, 'ah', {
      0x0: () => {
        const now = Date.now(),
          ticks = (this.timer.lastReset - now) / this.timer.speed;

        Object.assign(this.regs, {
          al: this.timer.lastReset - now >= 86400000 ? 0x1 : 0x0,
          dx: ticks & 0xFFFF,
          cx: (ticks >> 0x10) & 0xFFFF,
        });
      },

      /** Read Time From Real Time Clock */
      0x2: () => {
        const now = new Date();

        Object.assign(this.regs, {
          ch: RTC.toBCD(now.getHours()),
          cl: RTC.toBCD(now.getMinutes()),
          dh: RTC.toBCD(now.getSeconds()),
          dl: 0x0,
        });
        this.regs.status.cf = 0;
      },
    });
  }

  /**
   * Slow method to convert each digit to binary
   *
   * @static
   * @param {Number}  num Number
   * @returns BCD encoded number
   */
  static toBCD(num: number): number {
    const str = num.toString();
    let out = 0;

    for (let i = 0; i < str.length; ++i)
      out = (out << 4) | parseInt(str[i], 10);

    return out;
  }
}
