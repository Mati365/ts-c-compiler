import {VGA} from '../VGA';

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGAPixBufCanvasRenderer
 */
export class VGAPixBufCanvasRenderer {
  protected ctx: CanvasRenderingContext2D;
  protected imageData: ImageData;

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
   * Detects if VGA mode has been changed and resize canvas to match it
   *
   * @private
   * @returns
   * @memberof VGAPixBufCanvasRenderer
   */
  private updateCanvasSize() {
    const {vga, imageData, canvas} = this;
    const screenSize = vga.getPixelScreenSize();

    if (imageData
        && screenSize.w === imageData.width
        && screenSize.h === imageData.height)
      return;

    canvas.width = screenSize.w;
    canvas.height = screenSize.h;

    this.imageData = new ImageData(canvas.width, canvas.height);

    // mark default value for alpha
    const {data} = this.imageData;
    for (let i = 3; i < data.length; i += 4)
      data[i] = 0xFF;
  }

  /**
   * Prints whole pixel buffer into canvas
   *
   * @memberof VGAPixBufCanvasRenderer
   */
  redraw(): void {
    this.updateCanvasSize();

    const {vga, ctx, imageData} = this;
    const screenSize = vga.getPixelScreenSize();

    vga.renderToImageBuffer(imageData.data);
    ctx.putImageData(imageData, 0, 0, 0, 0, screenSize.w, screenSize.h);
  }
}
