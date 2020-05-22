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
  abstract renderToPixelBuf(line: number): void;
}
