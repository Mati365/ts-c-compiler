import { MemoryRegionRange } from '@x86-toolkit/cpu/memory/MemoryRegion';
import { VGACanvasRenderer } from './VGACanvasRenderer';

/**
 * Class that renders VGA memory into canvas
 */
export abstract class VGAPixBufCanvasRenderer extends VGACanvasRenderer {
  protected imageData: ImageData;
  protected dirty = new MemoryRegionRange(0, 0);

  /**
   * Marks whole pix buf as dirty
   */
  markWholeRegionAsDirty(): void {
    const { dirty } = this;

    dirty.low = -1;
    dirty.high = -1;
  }

  /**
   * Marks memory in region to be rerendered.
   * It is used generally in graphics modes, in text mode
   * there is ascii buffer cache
   */
  markRegionAsDirty(low: number, high: number): MemoryRegionRange {
    const { dirty } = this;

    dirty.low = dirty.low === null ? low : Math.min(low, dirty.low);
    dirty.high = dirty.high === null ? high : Math.max(high, dirty.high);

    return dirty;
  }

  /**
   * Assigns the same values to dirty so isDirtyBuffer will return false
   */
  resetDirtyFlags() {
    const { dirty } = this;

    dirty.low = null;
    dirty.high = null;
  }

  /**
   * Returns true if pixel buffer needs to be rerendered
   */
  isDirtyBuffer(): boolean {
    const {
      dirty: { low, high },
    } = this;

    return low === -1 || low !== high;
  }

  /**
   * Detects if VGA mode has been changed and resize canvas to match it
   */
  protected updateCanvasSize(): boolean {
    if (!super.updateCanvasSize()) {
      return false;
    }

    const { canvas } = this;
    this.imageData = new ImageData(canvas.width, canvas.height);

    // mark default value for alpha
    const { data } = this.imageData;
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 0xff;
    }

    return true;
  }

  /**
   * Renders imageData to canvas
   */
  protected drawImgDataToCanvas(): void {
    const { vga, ctx, imageData } = this;
    const screenSize = vga.getPixelScreenSize();

    ctx.putImageData(imageData, 0, 0, 0, 0, screenSize.w, screenSize.h);
  }

  /**
   * Transfers data to image data
   */
  protected abstract drawToImageData(
    buffer: Uint8ClampedArray,
    frameNumber: number,
  ): void;

  /**
   * Prints whole pixel buffer into canvas
   */
  redraw(frameNumber: number): void {
    super.redraw(frameNumber);

    if (this.imageData) {
      this.drawToImageData(this.imageData.data, frameNumber);
      this.drawImgDataToCanvas();
    }
  }
}
