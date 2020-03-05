/**
 * @see {@link https://web.archive.org/web/20140307023908/http://fly.srk.fer.hr/GDM/articles/sndmus/speaker1.html}
 *
 * @todo
 *  Move to separate device!
 *  Timer 0 should generate 8h interrupt!
 *  Timer 1 refreshes RAM
 *  Timer 2 sound timer
 *
 * @class Timer
 */
type CountdownTimerState = {
  waitForValue: number,
};

export class CountdownTimer {
  static SYSTEM_OSCILLATOR = 1193180;

  public state: CountdownTimerState = {
    waitForValue: 0,
  };

  constructor(
    public countdown: number = 0,
    public value: number = countdown,
  ) {}

  tick() {
    this.value--;
    if (this.value < 0)
      this.value = this.countdown;
  }

  getFrequency() {
    return CountdownTimer.SYSTEM_OSCILLATOR / this.countdown;
  }
}

/**
 * Audio speaker related timer
 *
 * @class Timer2
 * @extends {CountdownTimer}
 */
export class Timer2 extends CountdownTimer {
  // todo: maybe it should be not magic?
  static RECEIVE_VALUE_BYTE = 0xB6;

  static FREQ_COUNTDOWN_BYTE_SIZE = 2;
}
