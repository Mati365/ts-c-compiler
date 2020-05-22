import {VGAPixBufRenderer} from './VGAPixBufRenderer';

/**
 * Renders text characters into pix buf
 *
 * @export
 * @class VGATextModePixBufRenderer
 * @extends {VGAPixBufRenderer}
 */
export class VGATextModePixBufRenderer extends VGAPixBufRenderer {
  isSuitable(): boolean {
    return this.vga.textMode;
  }

  /**
   * @see CharMapSelectReg
   * @see {@link https://github.com/h0MER247/jPC/blob/master/src/Hardware/Video/VGA/VGAAdapter.java}
   *
   * @param {number} line
   * @memberof VGATextModePixBufRenderer
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  renderToPixelBuf(line: number): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
