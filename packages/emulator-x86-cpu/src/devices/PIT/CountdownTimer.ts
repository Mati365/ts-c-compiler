import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';
import {PIT} from './PIT';

/**
 * Intel 8253
 *
 * @see {@link https://web.archive.org/web/20140307023908/http://fly.srk.fer.hr/GDM/articles/sndmus/speaker1.html}
 * @see {@link https://en.wikipedia.org/wiki/Intel_8253}
 *
 * @todo
 *  Move to separate device!
 *  Timer 0 should generate 8h interrupt!
 *  Timer 1 refreshes RAM
 *  Timer 2 sound timer
 *
 * @class Timer
 */
export enum TimerDecrementMode {
  BINARY = 0x0,
  BCD = 0x1,
}

export enum TimerAccessMode {
  ACCESS_LATCHED_LI_HI_BYTE = 0x0,
  ACCESS_LO_BYTE_ONLY = 0x1,
  ACCESS_HI_BYTE_ONLY = 0x2,
  ACCESS_LO_HI_BYTE = 0x3,
}

export enum TimerOperatingMode {
  INTERRUPT_ON_TERMINAL_COUNT = 0b000,
  HARDWARE_RETRIGERABLE_ONE_SHOT = 0b001,
  RATE_GENERATOR = 0b010,
  SQUARE_WAVE = 0b011,
  SOFTWARE_TRIGGERED_STROBE = 0b100,
  HARDWARE_TRIGGERED_STROBE = 0b101,
}

/**
 * @see {@link https://wiki.osdev.org/Programmable_Interval_Timer IO/Ports}
 */
export class TimerControlByte extends UnionStruct {
  @bits(0) decrementMode: TimerDecrementMode;
  @bits(1, 3) operatingMode: TimerOperatingMode;
  @bits(4, 5) accessMode: TimerAccessMode;
  @bits(6, 7) channel: number;
}

/**
 * Timer that countdown
 *
 * @export
 * @class CountdownTimer
 */
export class CountdownTimer {
  static SYSTEM_OSCILLATOR = 1193.1816666; // 1.193182 MHz

  rolledOver: boolean = false;
  accessByteOffset: number = 0x0;
  latchValue: number = 0x0;

  constructor(
    public controlByte: TimerControlByte = new TimerControlByte(0x0),
    public countdown: number = null,
    public startValue: number = 0xFFFF,
  ) {
    this.reset();
  }

  reset() {
    this.latchValue = 0x0;
    this.accessByteOffset = 0x0;
    this.rolledOver = false;
  }

  check(pit: PIT) {
    const {controlByte} = this;

    this.getValue();
    if (controlByte.channel === 0x0
      && controlByte.operatingMode === TimerOperatingMode.INTERRUPT_ON_TERMINAL_COUNT) {
      pit.raiseIRQ();
    }
  }

  getFrequency() {
    return CountdownTimer.SYSTEM_OSCILLATOR / this.countdown;
  }

  /*
   * Get timer value for current time
   *
   * @returns
   * @memberof CountdownTimer
   */
  getValue() {
    const {startValue, countdown} = this;
    const diff = Date.now() - startValue;
    const diffInTicks = Math.floor(diff * CountdownTimer.SYSTEM_OSCILLATOR);

    let value = startValue - diffInTicks;
    if (value >= countdown) {
      value %= countdown;
      this.rolledOver = true;
    } else if (value < 0) {
      value = (value % countdown) + countdown;
      this.rolledOver = true;
    }

    return value;
  }
}
