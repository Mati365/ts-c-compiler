import {VGAPixBufCanvasRenderer} from './utils/VGAPixBufCanvasRenderer';

/**
 * Graphics modes renderer
 *
 * @todo
 *  Add diff cache!
 *
 * @export
 * @class VGAGraphicsModeCanvasRenderer
 * @extends {VGAPixBufCanvasRenderer}
 */
export class VGAGraphicsModeCanvasRenderer extends VGAPixBufCanvasRenderer {
  private cachedShiftLoads = new Uint8Array(8);

  isSuitable(): boolean {
    return !this.vga.textMode;
  }

  /**
   * Moves VGA planes data into pixel buffer
   *
   * @todo
   *  Add dirty mode diffing
   *
   * @private
   * @memberof VGAGraphicsModeCanvasRenderer
   */
  private transferToVGAPixelBuffer() {
    const {vga, cachedShiftLoads} = this;
    const {crtcRegs, graphicsRegs, attrRegs} = vga;

    const {virtualSize} = vga.getGraphicsModeState();
    const planes = vga.getPlanes();
    const pixelBuffer = vga.getPixelBuffer();
    const startAddress = vga.getStartAddress();
    const addressShift = vga.getAddressShiftCount();
    const addressSubstitution = ~crtcRegs.crtcModeControlReg & 0x3;
    const shiftMode = graphicsRegs.graphicsModeReg.number & 0x60;
    const pelWidth = attrRegs.attrModeControlReg.bit8;

    for (let pixelAddr = 0; pixelAddr < pixelBuffer.length; ++pixelAddr) {
      let address = pixelAddr >>> addressShift;

      if (addressSubstitution) {
        let row = pixelAddr / virtualSize.w | 0;
        const col = pixelAddr - virtualSize.h * row;

        switch (addressSubstitution) {
          case 0x1:
            address = (row & 0x1) << 13;
            row >>>= 1;
            break;

          case 0x2:
            address = (row & 0x1) << 14;
            row >>>= 1;
            break;

          case 0x3:
            address = (row & 0x3) << 13;
            row >>>= 2;
            break;
          default:
        }

        address |= (row * virtualSize.w + col >>> addressShift) + startAddress;
      }

      let byte0 = planes[0][address];
      let byte1 = planes[1][address];
      let byte2 = planes[2][address];
      let byte3 = planes[3][address];

      switch (shiftMode) {
        // Planar Shift Mode
        case 0x00:
          byte0 <<= 0;
          byte1 <<= 1;
          byte2 <<= 2;
          byte3 <<= 3;

          for (let i = 7; i >= 0; i--) {
            cachedShiftLoads[7 - i] = (
              ((byte0 >> i) & 1)
                    | ((byte1 >> i) & 2)
                    | ((byte2 >> i) & 4)
                    | ((byte3 >> i) & 8)
            );
          }
          break;

        // Packed Shift Mode, aka Interleaved Shift Mode
        // Video Modes 4h and 5h
        case 0x20:
          cachedShiftLoads[0] = ((byte0 >> 6) & 0x3) | ((byte2 >> 4) & 0xC);
          cachedShiftLoads[1] = ((byte0 >> 4) & 0x3) | ((byte2 >> 2) & 0xC);
          cachedShiftLoads[2] = ((byte0 >> 2) & 0x3) | ((byte2 >> 0) & 0xC);
          cachedShiftLoads[3] = ((byte0 >> 0) & 0x3) | ((byte2 << 2) & 0xC);

          cachedShiftLoads[4] = ((byte1 >> 6) & 0x3) | ((byte3 >> 4) & 0xC);
          cachedShiftLoads[5] = ((byte1 >> 4) & 0x3) | ((byte3 >> 2) & 0xC);
          cachedShiftLoads[6] = ((byte1 >> 2) & 0x3) | ((byte3 >> 0) & 0xC);
          cachedShiftLoads[7] = ((byte1 >> 0) & 0x3) | ((byte3 << 2) & 0xC);
          break;

        // 256-Color Shift Mode
        // Video Modes 13h and unchained 256 color
        case 0x40:
        case 0x60:
          cachedShiftLoads[0] = (byte0 >> 4) & 0xF;
          cachedShiftLoads[1] = (byte0 >> 0) & 0xF;
          cachedShiftLoads[2] = (byte1 >> 4) & 0xF;
          cachedShiftLoads[3] = (byte1 >> 0) & 0xF;
          cachedShiftLoads[4] = (byte2 >> 4) & 0xF;
          cachedShiftLoads[5] = (byte2 >> 0) & 0xF;
          cachedShiftLoads[6] = (byte3 >> 4) & 0xF;
          cachedShiftLoads[7] = (byte3 >> 0) & 0xF;
          break;

        default:
      }

      if (pelWidth) {
        for (let i = 0, j = 0; i < 4; i++, pixelAddr++, j += 2)
          pixelBuffer[pixelAddr] = (cachedShiftLoads[j] << 4) | cachedShiftLoads[j + 1];
      } else {
        for (let i = 0; i < 8; i++, pixelAddr++)
          pixelBuffer[pixelAddr] = cachedShiftLoads[i];
      }
    }
  }

  /**
   * Renders pixel buffer content into canvas image
   *
   * @todo
   *  Add dirty mode diffing
   *
   * @private
   * @param {Uint8ClampedArray} buffer
   * @memberof VGAGraphicsModeCanvasRenderer
   */
  private transferToCanvasBuffer(buffer: Uint8ClampedArray): void {
    const {vga} = this;
    const {
      attrRegs: {
        attrModeControlReg,
        colorSelectReg,
        paletteRegs,
        colorPlaneEnableReg,
      },
    } = vga;

    const pixelBuffer = vga.getPixelBuffer();
    const vga256 = vga.getVGA256State();

    let mask = 0xFF;
    let colorset = 0x0;

    // palette bits 5/4 select
    if (attrModeControlReg.p54s) {
      mask &= 0xCF;
      colorset |= (colorSelectReg.number << 4) & 0x30;
    }

    if (attrModeControlReg.bit8) {
      // bit 8 mode
      for (let pixelAddr = 0; pixelAddr < pixelBuffer.length; ++pixelAddr) {
        const imgBufferAddr = pixelAddr << 2;
        const bufferColor = (pixelBuffer[pixelAddr] & mask) | colorset;
        const color = vga256.palette[bufferColor];

        buffer[imgBufferAddr] = color.r;
        buffer[imgBufferAddr + 1] = color.g;
        buffer[imgBufferAddr + 2] = color.b;
        buffer[imgBufferAddr + 3] = 0xFF;
      }
    } else {
      // bit 4 mode
      mask &= 0x3F;
      colorset |= (colorSelectReg.number << 4) & 0xC0;

      const colorPlane = colorPlaneEnableReg.colorPlaneEnable;
      for (let pixelAddr = 0; pixelAddr < pixelBuffer.length; ++pixelAddr) {
        const imgBufferAddr = pixelAddr << 2;
        const color16 = pixelBuffer[pixelAddr] & colorPlane;
        const bufferColor = (paletteRegs[color16] & mask) | colorset;
        const color = vga256.palette[bufferColor];

        buffer[imgBufferAddr] = color.r;
        buffer[imgBufferAddr + 1] = color.g;
        buffer[imgBufferAddr + 2] = color.b;
        buffer[imgBufferAddr + 3] = 0xFF;
      }
    }
  }

  /**
   * Renders pixel buffer into image buffer
   *
   * @param {Uint8ClampedArray} buffer
   * @memberof VGAGraphicsModeCanvasRenderer
   */
  drawToImageData(buffer: Uint8ClampedArray) {
    this.transferToVGAPixelBuffer();
    this.transferToCanvasBuffer(buffer);
  }
}
