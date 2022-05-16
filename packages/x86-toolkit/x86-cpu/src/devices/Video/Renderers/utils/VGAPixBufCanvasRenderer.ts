import {MemoryRegionRange} from 'x86-toolkit/x86-cpu/src/memory/MemoryRegion';
import {VGACanvasRenderer} from './VGACanvasRenderer';

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGAPixBufCanvasRenderer
 */
export abstract class VGAPixBufCanvasRenderer extends VGACanvasRenderer {
  protected imageData: ImageData;
  protected dirty = new MemoryRegionRange(0, 0);

  /**
   * Marks whole pix buf as dirty
   *
   * @memberof VGAPixBufCanvasRenderer
   */
  markWholeRegionAsDirty(): void {
    const {dirty} = this;

    dirty.low = -1;
    dirty.high = -1;
  }

  /**
   * Marks memory in region to be rerendered.
   * It is used generally in graphics modes, in text mode
   * there is ascii buffer cache
   *
   * @param {number} low
   * @param {number} high
   * @returns {MemoryRegionRange}
   * @memberof VGAPixBufCanvasRenderer
   */
  markRegionAsDirty(low: number, high: number): MemoryRegionRange {
    const {dirty} = this;

    dirty.low = dirty.low === null ? low : Math.min(low, dirty.low);
    dirty.high = dirty.high === null ? high : Math.max(high, dirty.high);

    return dirty;
  }

  /**
   * Assigns the same values to dirty so isDirtyBuffer will return false
   *
   * @memberof VGAPixBufCanvasRenderer
   */
  resetDirtyFlags() {
    const {dirty} = this;

    dirty.low = null;
    dirty.high = null;
  }

  /**
   * Returns true if pixel buffer needs to be rerendered
   *
   * @returns {boolean}
   * @memberof VGAPixBufCanvasRenderer
   */
  isDirtyBuffer(): boolean {
    const {dirty: {low, high}} = this;

    return low === -1 || low !== high;
  }

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
   * @param {number} frameNumber
   * @memberof VGAPixBufCanvasRenderer
   */
  protected abstract drawToImageData(buffer: Uint8ClampedArray, frameNumber: number): void;

  /**
   * Prints whole pixel buffer into canvas
   *
   * @param {number} frameNumber
   * @memberof VGAPixBufCanvasRenderer
   */
  redraw(frameNumber: number): void {
    super.redraw(frameNumber);

    if (this.imageData) {
      this.drawToImageData(this.imageData.data, frameNumber);
      this.drawImgDataToCanvas();
    }
  }
}
