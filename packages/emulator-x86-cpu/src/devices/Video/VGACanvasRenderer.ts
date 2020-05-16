import {VGA} from './VGA';

/**
 * Util class that implements renderable for BIOS
 *
 * @export
 * @abstract
 * @class CanvasRenderer
 */
export abstract class CanvasRenderer {
  protected readonly ctx: CanvasRenderingContext2D;

  constructor(
    public readonly canvas: HTMLCanvasElement,
  ) {
    this.ctx = canvas.getContext('2d');
  }

  abstract redraw(): void;
}

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGACanvasRenderer
 * @implements {CanvasRenderer}
 */
export class VGACanvasRenderer extends CanvasRenderer {
  constructor(
    canvas: HTMLCanvasElement,
    public readonly vga: VGA,
  ) {
    super(canvas);
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
   *
   *
   * @memberof VGACanvasRenderer
   */
  redraw(): void {
    const {ctx} = this;
    const {width, height} = ctx.canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }
}
