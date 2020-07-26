import {VGA} from '../../VGA';

/**
 * Simple renderer that renders content into pixel buffer
 *
 * @export
 * @abstract
 * @class VGACanvasRenderer
 */
export abstract class VGACanvasRenderer {
  protected ctx: CanvasRenderingContext2D;
  protected canvas: HTMLCanvasElement;

  constructor(
    protected readonly vga: VGA,
  ) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Checks if current canvas size matches VGA size,
   * if not returns true and resizes
   *
   * @protected
   * @returns {boolean}
   * @memberof VGACanvasRenderer
   */
  protected updateCanvasSize(): boolean {
    const {vga, canvas} = this;
    const screenSize = vga.getPixelScreenSize();

    if (!canvas || (screenSize.w === canvas.width && screenSize.h === canvas.height))
      return false;

    canvas.width = screenSize.w;
    canvas.height = screenSize.h;

    Object.assign(
      canvas.style,
      {
        width: `${screenSize.w}px`,
        height: `${screenSize.h}px`,
      },
    );

    return canvas.width * canvas.height > 0;
  }

  abstract isSuitable(): boolean;

  /**
   * Called when VGA enables mode
   *
   * @memberof VGACanvasRenderer
   */
  alloc(): void {
    const {vga, canvas} = this;

    vga
      .getScreenElement()
      .appendChild(canvas);
  }

  /**
   * Called when VGA disables mode and chooses other
   *
   * @memberof VGACanvasRenderer
   */
  release(): void {
    const {vga, canvas} = this;

    vga
      .getScreenElement()
      .removeChild(canvas);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Flushes content to canvas
   *
   * @param {number} frameNumber
   * @memberof VGACanvasRenderer
   */
  redraw(frameNumber: number): void {
    this.updateCanvasSize();
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
