import {VGAPixBufCanvasRenderer} from './utils/VGAPixBufCanvasRenderer';

/**
 * Text mode pixel perfect renderer
 *
 * @export
 * @class VGATextModeCanvasRenderer
 * @extends {VGAPixBufCanvasRenderer}
 */
export class VGATextModeCanvasRenderer extends VGAPixBufCanvasRenderer {
  private renderCharsCache: number[];

  isSuitable(): boolean {
    return this.vga.textMode;
  }

  alloc(): void {
    super.alloc();

    const {size} = this.vga.getTextModeState();
    this.renderCharsCache = new Array(size.w * size.h);
  }

  release(): void {
    super.release();

    this.renderCharsCache = null;
  }

  drawToImageData(buffer: Uint8ClampedArray, frameNumber: number): void {
    const {vga, renderCharsCache} = this;
    const {crtcRegs, attrRegs} = vga;
    const {textMem, textAttrsMem, textFontMem} = vga;
    const {paletteRegs} = vga.attrRegs;
    const {pixelMask} = vga.dacRegs;

    const vga256 = vga.getVGA256State();
    const screenSize = vga.getPixelScreenSize();
    const {size, charSize} = vga.getTextModeState();
    const [charsetARegion, charsetBRegion] = vga.sequencerRegs.getCharsetMemRegions();

    const cursorEnabled = !crtcRegs.isTextCursorDisabled();
    const cursorAddress = crtcRegs.cursorLocation.number;

    const cursorStart = crtcRegs.getCursorScanLineStart();
    const cursorEnd = crtcRegs.getCursorScanLineEnd();

    const blink = attrRegs.isBlinkEnabled() && frameNumber >= 0x18;

    // todo: add cursor, blinking, partial dirty rendering
    // iterate over all characters
    for (let screenRow = 0; screenRow < size.h; ++screenRow) {
      for (let screenCol = 0; screenCol < size.w; ++screenCol) {
        const charMemOffset = screenCol + screenRow * size.w;
        const currentCursor = cursorEnabled && cursorAddress - size.w === charMemOffset;

        const char = textMem[charMemOffset];
        const attr = textAttrsMem[charMemOffset];

        const charFontOffset = (
          ((attr & 0x8) !== 0
            ? charsetARegion
            : charsetBRegion).low + (char << 5)
        );

        let fgColor = (attr & 0xF) & 0xFF;
        let bgColor = (attr >> 4) & 0xFF;
        let swapColors = false;

        // if character is already rendered - ignore
        if (currentCursor && !blink)
          fgColor = 0x0;
        else if (blink && ((attr & 0x80) !== 0))
          swapColors = true;

        // flips background with fg
        if (swapColors) {
          fgColor ^= bgColor;
          bgColor ^= fgColor;
          fgColor ^= bgColor;
        }

        const cacheKey = (char << 16) | (fgColor << 8) | bgColor;
        if (renderCharsCache[charMemOffset] === cacheKey)
          continue;

        renderCharsCache[charMemOffset] = cacheKey;

        if (currentCursor) {
          // draw cursor
          for (let row = 0; row < cursorEnd; ++row) {
            const destRowOffset = screenSize.w * (row + screenRow * charSize.h) * 4;
            const color = vga256.palette[
              pixelMask & paletteRegs[row >= cursorStart ? fgColor : bgColor]
            ];

            for (let col = 0; col < charSize.w; ++col) {
              const destColOffset = (col + screenCol * charSize.w) << 2;

              buffer[destRowOffset + destColOffset] = color.r;
              buffer[destRowOffset + destColOffset + 1] = color.g;
              buffer[destRowOffset + destColOffset + 2] = color.b;
            }
          }
        } else {
          // draw character
          for (let row = 0; row < charSize.h; ++row) {
            const charBitsetRow = textFontMem[charFontOffset + row];
            const destRowOffset = screenSize.w * (row + screenRow * charSize.h) * 4;

            for (let col = 0; col < charSize.w; ++col) {
              const bit = (charBitsetRow >> col) & 0x1;
              const destColOffset = (col + screenCol * charSize.w) << 2;
              const color = vga256.palette[
                pixelMask & paletteRegs[bit === 1 ? fgColor : bgColor]
              ];

              buffer[destRowOffset + destColOffset] = color.r;
              buffer[destRowOffset + destColOffset + 1] = color.g;
              buffer[destRowOffset + destColOffset + 2] = color.b;
            }
          }
        }
      }
    }
  }
}
