import {CountdownTimer} from './CountdownTimer';

type SpeakerAudioContext = {
  ctx: AudioContext,
  oscillator: OscillatorNode,
  gainNode: GainNode,
};

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
