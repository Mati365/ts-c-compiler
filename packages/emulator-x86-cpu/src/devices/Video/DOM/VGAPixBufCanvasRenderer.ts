import {VGA} from '../VGA';

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGAPixBufCanvasRenderer
 */
export class VGAPixBufCanvasRenderer {
  protected ctx: CanvasRenderingContext2D;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly vga: VGA,
  ) {
    this.ctx = canvas.getContext('2d');
    this.init();
  }

  /**
   * Prepare HTML canvas for rendering
   *
   * @memberof VGACanvasRenderer
   */
  init() {
    const {ctx} = this;

    ctx.imageSmoothingEnabled = false;
  }

  /**
   * Prints whole pixel buffer into canvas
   *
   * @memberof VGAPixBufCanvasRenderer
   */
  redraw(): void {
    const {vga} = this;

    vga.refreshPixelBuffer();
  }
}
