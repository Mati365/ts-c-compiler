import Device from './Device';

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
class CountdownTimer {
  static SYSTEM_OSCILLATOR = 1193180;

  constructor(countdown, value = countdown) {
    this.countdown = countdown;
    this.value = value;
    this.state = {
      // when send to 43h magic value it should be 2 and wait for two bytes of data
      waitForValue: 0,
    };
  }

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
class Timer2 extends CountdownTimer {
  // todo: maybe it should be not magic?
  static RECEIVE_VALUE_BYTE = 0xB6;

  static FREQ_COUNTDOWN_BYTE_SIZE = 2;
}

/**
 * Real-Time Clock
 *
 * @see {@link http://www.ic.unicamp.br/~celio/mc404s102/pcspeaker/InternalSpeaker.htm}
 * @see {@link https://web.archive.org/web/20140307023908/http://fly.srk.fer.hr/GDM/articles/sndmus/speaker1.html}
 *
 * @class Speaker
 * @extends {Device}
 */
export default class Speaker extends Device('speaker') {
  constructor({volume = 0.1} = {}) {
    super();
    this.volume = volume;
  }

  init() {
    this.audio = {
      ctx: null,
      oscillator: null,
      gainNode: null,
    };

    this.enabled = false;
    this.controlByte = 0;
    this.soundTimer = new Timer2;

    this.setFlagsBitset(0x0);

    this.ports = {
      /* tell timer that should it will receive data */
      0x43: {
        set: (data) => {
          // maybe it should not be magic value?
          if (data !== Timer2.RECEIVE_VALUE_BYTE)
            return;

          // toggle wait flag, it will be filled in incoming 0x42 port as word
          this.disableAudio(true);
          this.soundTimer.state.waitForValue = Timer2.FREQ_COUNTDOWN_BYTE_SIZE;
        },
      },

      /* load timer countdown value using two bytes */
      0x42: {
        set: (data) => {
          const {soundTimer} = this;
          const {state} = soundTimer;

          // missing 0x43 flag
          if (!state.waitForValue)
            return;

          // receive value in several bytes
          const offset = (Timer2.FREQ_COUNTDOWN_BYTE_SIZE - state.waitForValue) * 0x8;
          soundTimer.countdown = ((data & 0xFF) << offset) | (soundTimer.countdown & 0xFF);
          state.waitForValue--;
        },
      },

      /* set timer flags */
      0x61: {
        get: ::this.getFlagsBitset,
        set: (bitset) => {
          const {flags: prevFlags} = this;

          this.setFlagsBitset(bitset);

          // detect enable
          const prevEnabled = Speaker.isEnabledByFlags(prevFlags);
          const currentEnabled = this.isEnabled();

          // turn on
          if (!prevEnabled && currentEnabled)
            this.initAudio();
          else if (prevEnabled && !currentEnabled)
            this.disableAudio();
        },
      },
    };
  }

  /**
   * Creates HTML5 audio instance
   *
   * @memberof Speaker
   */
  initAudio() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // volume set
      gainNode.gain.value = this.volume;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // square wave
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(
        this.soundTimer.getFrequency(),
        ctx.currentTime,
      );

      oscillator.start();

      this.audio = {
        ctx,
        oscillator,
        gainNode,
      };
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Disable audio instance
   *
   * @memberof Speaker
   */
  disableAudio(withBits = false) {
    const {ctx, oscillator} = this.audio;

    oscillator?.stop();
    ctx?.close();

    if (withBits)
      this.setFlagsBitset(0x0);
  }

  /**
   * Return bitfield based on flags object value
   *
   * @returns {Number}
   * @memberof Speaker
   */
  getFlagsBitset() {
    const {flags} = this;

    return (
      +flags.enabledByte
        | (+flags.gate2Enabled << 0x1)
    );
  }

  /**
   * Set flags value based on bitset
   *
   * @param {Number} bitset
   * @memberof Speaker
   */
  setFlagsBitset(bitset) {
    this.flags = {
      /* 0nth bit */ enabledByte: !!(bitset & 0x1),
      /* 1nth bit */ gate2Enabled: !!(bitset & 0x2),
    };
    return this.flags;
  }

  /**
   * Checks if speaker has enable volume
   *
   * @returns
   * @memberof Speaker
   */
  isEnabled() {
    return Speaker.isEnabledByFlags(this.flags);
  }

  /**
   * Check if timer bitset flags is enabled
   *
   * @static
   * @param {SpeakerFlags} flags
   * @returns
   * @memberof Speaker
   */
  static isEnabledByFlags(flags) {
    return flags.enabledByte && flags.gate2Enabled;
  }
}
