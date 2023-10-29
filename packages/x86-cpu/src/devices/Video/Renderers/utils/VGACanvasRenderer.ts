import * as R from 'ramda';

import { Size } from '@ts-c/core';
import { VGA } from '../../VGA';

/**
 * Simple renderer that renders content into pixel buffer
 */
export abstract class VGACanvasRenderer {
  protected ctx: CanvasRenderingContext2D;
  protected canvas: HTMLCanvasElement;

  constructor(protected readonly vga: VGA) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Checks if current canvas size matches VGA size,
   * if not returns true and resizes
   */
  protected updateCanvasSize(): boolean {
    const { vga, canvas } = this;
    const screenSize = vga.getPixelScreenSize();
    const upscaleWidth = vga.getPixelUpscaleWidth();

    if (
      !canvas ||
      (screenSize.w === canvas.width && screenSize.h === canvas.height)
    ) {
      return false;
    }

    canvas.width = screenSize.w;
    canvas.height = screenSize.h;

    const canvasSize: Readonly<Size> = R.isNil(upscaleWidth)
      ? screenSize
      : new Size(upscaleWidth, upscaleWidth * (screenSize.h / screenSize.w));

    Object.assign(canvas.style, {
      width: `${canvasSize.w}px`,
      height: `${canvasSize.h}px`,
    });

    return canvas.width * canvas.height > 0;
  }

  abstract isSuitable(): boolean;

  /**
   * Called when VGA enables mode
   */
  alloc(): void {
    const { vga, canvas } = this;

    vga.getScreenElement().appendChild(canvas);
  }

  /**
   * Called when VGA disables mode and chooses other
   */
  release(): void {
    const { vga, canvas } = this;

    vga.getScreenElement().removeChild(canvas);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Flushes content to canvas
   */
  redraw(frameNumber: number): void {
    this.updateCanvasSize();
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
