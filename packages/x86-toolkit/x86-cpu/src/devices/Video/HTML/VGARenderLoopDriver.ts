import { asap } from '@compiler/core/utils/asap';
import { uuidX86Device } from '@x86-toolkit/cpu/parts';

import { VGAPixBufCanvasRenderer } from '../Renderers';
import { VGA } from '../VGA';

type VGARenderLoopDriverInitConfig = {
  screenElement: HTMLElement;
  upscaleWidth?: number;
};

/**
 * Driver that inits render loop and renders content to Canvas
 */
export class VGARenderLoopDriver extends uuidX86Device('vgaRenderLoop') {
  private screenElement: HTMLElement = null;
  private upscaleWidth: number = null;
  private frameNumber: number = 0;

  get vga(): VGA {
    const { devices } = this.cpu;

    return <VGA>(devices && devices.vga);
  }

  init({ screenElement, upscaleWidth }: VGARenderLoopDriverInitConfig): void {
    this.screenElement = screenElement;
    this.upscaleWidth = upscaleWidth;
  }

  boot(): void {
    /** Monitor render loop */
    const { screenElement, upscaleWidth, cpu, vga } = this;
    if (screenElement) {
      /** Render loop */
      vga.setScreenElement({
        upscaleWidth,
        screenElement,
      });

      try {
        asap(() => {
          cpu.exec(1);
          return !cpu.isHalted();
        });
      } catch (e) {
        cpu.logger.error(e.stack);
      }

      const frame = () => {
        if (cpu.isHalted()) {
          const renderer = vga.getCurrentRenderer();
          if (renderer instanceof VGAPixBufCanvasRenderer) {
            renderer.markWholeRegionAsDirty();
          }

          this.redraw();
          return;
        }

        this.redraw();
        requestAnimationFrame(frame);
      };

      requestAnimationFrame(frame);
    }
  }

  redraw(): void {
    const { vga } = this;
    if (!vga) {
      return;
    }

    vga.getCurrentRenderer().redraw(this.frameNumber);

    this.frameNumber = (this.frameNumber + 1) % 0x30;
  }
}
