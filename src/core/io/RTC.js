import Device from './Device';

/**
 * Real-Time Clock
 * ref: http://students.mimuw.edu.pl/SO/Projekt03-04/temat3-g4/cmos.html
 *
 * @class RTC
 * @extends {Device}
 */
export default class RTC extends Device {
  init() {
    const date = new Date;

    this.index = 0;
    this.offsets = {
      0x0: date.getSeconds,
      0x2: date.getMinutes,
      0x4: date.getHours,
      0x6: date.getDay,
      0x7: date.getDate,
      0x8: date.getMonth,
      0x9: date.getFullYear,
    };

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
  }

  /**
   * Slow method to convert each digit to binary
   *
   * @static
   * @param {Number}  num Number
   * @returns BCD encoded number
   */
  static toBCD(num) {
    const str = num.toString();
    let out = 0;

    for (let i = 0; i < str.length; ++i)
      out = (out << 4) | parseInt(str[i], 10);
    return out;
  }
}
