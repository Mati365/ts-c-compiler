import {VGACanvasRenderer} from './VGACanvasRenderer';

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGAPixBufCanvasRenderer
 */
export abstract class VGAPixBufCanvasRenderer extends VGACanvasRenderer {
  protected imageData: ImageData;

  /**
   * Detects if VGA mode has been changed and resize canvas to match it
   *
   * @protected
   * @returns
   * @memberof VGAPixBufCanvasRenderer
   */
  protected updateCanvasSize(): boolean {
    if (!super.updateCanvasSize())
      return false;

    const {canvas} = this;
    this.imageData = new ImageData(canvas.width, canvas.height);

    // mark default value for alpha
    const {data} = this.imageData;
    for (let i = 3; i < data.length; i += 4)
      data[i] = 0xFF;

    return true;
  }

  /**
   * Renders imageData to canvas
   *
   * @protected
   * @memberof VGAPixBufCanvasRenderer
   */
  protected drawImgDataToCanvas(): void {
    const {vga, ctx, imageData} = this;
    const screenSize = vga.getPixelScreenSize();

    ctx.putImageData(imageData, 0, 0, 0, 0, screenSize.w, screenSize.h);
  }

  /**
   * Transfers data to image data
   *
   * @protected
   * @abstract
   * @param {Uint8ClampedArray} buffer
   * @memberof VGAPixBufCanvasRenderer
   */
  protected abstract drawToImageData(buffer: Uint8ClampedArray): void;

  /**
   * Prints whole pixel buffer into canvas
   *
   * @memberof VGAPixBufCanvasRenderer
   */
  redraw(): void {
    super.redraw();
    this.drawToImageData(this.imageData.data);
    this.drawImgDataToCanvas();
  }
}
