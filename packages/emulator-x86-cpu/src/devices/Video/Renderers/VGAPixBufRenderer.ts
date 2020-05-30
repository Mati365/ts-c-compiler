import {VGA} from '../VGA';

/**
 * Simple renderer that renders content into pixel buffer
 *
 * @export
 * @abstract
 * @class VGAPixBufRenderer
 */
export abstract class VGAPixBufRenderer {
  constructor(
    protected readonly vga: VGA,
  ) {}

  abstract isSuitable(): boolean;

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Renders data into graphical pixel buffer.
   * Used only in graphical modes, text modes
   * are using directly overriden renderToImageBuffer
   *
   * @param {Uint8Array} buffer
   * @memberof VGAPixBufRenderer
   */
  renderToPixelBuffer(buffer: Uint8Array): void {}

  /**
   * Renders pixel buffer directly to canvas
   *
   * @param {Uint8ClampedArray} buffer
   * @memberof VGAPixBufRenderer
   */
  renderToImageBuffer(buffer: Uint8ClampedArray): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
