import {CountdownTimer} from './CountdownTimer';

type SpeakerAudioContext = {
  ctx: AudioContext,
  oscillator: OscillatorNode,
  gainNode: GainNode,
};

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
 * Beeper
 *
 * @export
 * @class SpeakerTimer
 * @extends {CountdownTimer}
 */
export class SpeakerTimer extends CountdownTimer {
  private volume: number = 0.1;
  private audio: SpeakerAudioContext = null;

  /**
   * Clears audio context and kills audio prop
   *
   * @memberof SpeakerTimer
   */
  reset() {
    this.disableAudio();
  }

  /**
   * Creates HTML5 audio instance
   *
   * @memberof PIT
   */
  initAudio(): void {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // volume set
      gainNode.gain.value = this.volume;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // square wave
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(
        this.getFrequency(),
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
   * @memberof PIT
   */
  disableAudio(): void {
    if (!this.audio)
      return;

    const {ctx, oscillator} = this.audio;
    this.audio = null;

    /* eslint-disable no-unused-expressions */
    oscillator?.stop();
    ctx?.close();
    /* eslint-enable no-unused-expressions */
  }
}
