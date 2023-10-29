import { X86UuidAbstractDevice } from '../parts/X86AbstractDevice';
import { X86CPU } from '../X86CPU';

type ClockTimerConfig = {
  currentMidnight: number;
  speed: number;
};

function getTodayMidnight(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
}

/**
 * CMOS
 *
 * @see {@link http://students.mimuw.edu.pl/SO/Projekt03-04/temat3-g4/cmos.html}
 */
export class CMOS extends X86UuidAbstractDevice<X86CPU> {
  static readonly uuid = 'cmos';

  private index: number = 0;
  private offsets: Record<number, () => number> = null;
  private timer: ClockTimerConfig;

  /**
   * Inits clock, sets current date
   */
  init() {
    const date = new Date();

    this.timer = {
      currentMidnight: +getTodayMidnight(),
      speed: 55 /** 55MS tick */,
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
        set: index => {
          this.index = index;
        },
      },
      0x71: {
        get: () => CMOS.toBCD(this.offsets[this.index].call(date)),
      },
    };

    /* INTERRUPTS */
    this.attachInterrupts(0x1a, 'ah', {
      0x0: () => {
        const { currentMidnight } = this.timer;
        const now = Date.now();
        const ticksFromMidnight = (now - currentMidnight) / this.timer.speed;

        Object.assign(this.regs, {
          al: now - currentMidnight >= 86400000 ? 0x1 : 0x0,
          dx: ticksFromMidnight & 0xffff,
          cx: (ticksFromMidnight >>> 0x10) & 0xffff,
        });
      },

      /** Read Time From Real Time Clock */
      0x2: () => {
        const now = new Date();

        Object.assign(this.regs, {
          ch: CMOS.toBCD(now.getHours()),
          cl: CMOS.toBCD(now.getMinutes()),
          dh: CMOS.toBCD(now.getSeconds()),
          dl: 0x0,
        });
        this.regs.status.cf = 0;
      },
    });
  }

  /**
   * Slow method to convert each digit to binary
   */
  static toBCD(num: number): number {
    const str = num.toString();
    let out = 0;

    for (let i = 0; i < str.length; ++i) {
      out = (out << 4) | parseInt(str[i], 10);
    }

    return out;
  }
}
