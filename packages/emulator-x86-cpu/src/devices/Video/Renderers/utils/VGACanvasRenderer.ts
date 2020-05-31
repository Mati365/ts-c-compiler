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

    if (screenSize.w === canvas.width
        && screenSize.h === canvas.height)
      return false;

    canvas.width = screenSize.w;
    canvas.height = screenSize.h;

    return true;
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

  /**
   * Flushes content to canvas
   *
   * @memberof VGACanvasRenderer
   */
  redraw(): void {
    this.updateCanvasSize();
  }
}
