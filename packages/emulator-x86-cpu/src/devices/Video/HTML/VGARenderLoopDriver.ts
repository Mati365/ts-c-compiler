import {asap} from '@compiler/core/utils/asap';
import {uuidX86Device} from '@emulator/x86-cpu/types';

import {VGA} from '../VGA';

type VGARenderLoopDriverInitConfig = {
  screenElement: HTMLElement,
  upscaleWidth?: number,
};

/**
 * Driver that inits render loop and renders content to Canvas
 *
 * @export
 * @class VGARenderLoopDriver
 * @extends {uuidX86Device('vgaRenderLoopDriver')}
 */
export class VGARenderLoopDriver extends uuidX86Device('vgaRenderLoop') {
  private screenElement: HTMLElement = null;
  private upscaleWidth: number = null;
  private frameNumber: number = 0;

  get vga(): VGA {
    return <VGA> this.cpu.devices.vga;
  }

  init({screenElement, upscaleWidth}: VGARenderLoopDriverInitConfig): void {
    this.screenElement = screenElement;
    this.upscaleWidth = upscaleWidth;
  }

  boot(): void {
    /** Monitor render loop */
    const {screenElement, upscaleWidth, cpu} = this;
    if (screenElement) {
      /** Render loop */
      const vga = <VGA> cpu.devices.vga;
      vga.setScreenElement(
        {
          upscaleWidth,
          screenElement,
        },
      );

      try {
        asap(
          () => {
            cpu.exec(1);
            return !cpu.isHalted();
          },
        );
      } catch (e) {
        cpu.logger.error(e.stack);
      }

      const frame = () => {
        if (cpu.isHalted())
          return;

        this.redraw();
        requestAnimationFrame(frame);
      };

      requestAnimationFrame(frame);
    }
  }

  redraw(): void {
    const {vga} = this;

    vga
      .getCurrentRenderer()
      .redraw(this.frameNumber);

    this.frameNumber = (this.frameNumber + 1) % 0x30;
  }
}
