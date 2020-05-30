import {VGAPixBufRenderer} from './VGAPixBufRenderer';

/**
 * Renders text characters into pix buf
 *
 * @export
 * @class VGATextModePixBufRenderer
 * @extends {VGAPixBufRenderer}
 */
export class VGATextModePixBufRenderer extends VGAPixBufRenderer {
  isSuitable(): boolean {
    return this.vga.textMode;
  }

  /**
   * Render text mode
   *
   * @see CharMapSelectReg
   * @see {@link https://github.com/h0MER247/jPC/blob/master/src/Hardware/Video/VGA/VGAAdapter.java}
   *
   * @param {Uint8ClampedArray} buffer
   * @memberof VGATextModePixBufRenderer
   */
  renderToImageBuffer(buffer: Uint8ClampedArray): void {
    const {vga} = this;
    const {textMem, textAttrsMem, textFontMem} = vga;
    const {paletteRegs} = vga.attrRegs;

    const vga256 = vga.getVGA256State();
    const screenSize = vga.getPixelScreenSize();
    const {size, charSize} = vga.getTextModeState();
    const [charsetARegion, charsetBRegion] = vga.sequencerRegs.getCharsetMemRegions();

    // todo: add cursor, blinking, partial dirty rendering
    // iterate over all characters
    for (let screenRow = 0; screenRow < size.w; ++screenRow) {
      for (let screenCol = 0; screenCol < size.w; ++screenCol) {
        const charMemOffset = screenCol + screenRow * size.w;
        const char = textMem[charMemOffset];
        const attr = textAttrsMem[charMemOffset];

        const charFontOffset = (
          ((attr & 0x8) !== 0
            ? charsetARegion
            : charsetBRegion).low + (char << 5)
        );

        const fgColor = (attr & 0xF) & 0xFF;
        const bgColor = (attr >> 4) & 0xFF;

        // print single character
        for (let row = 0; row < charSize.h; ++row) {
          const charBitsetRow = textFontMem[charFontOffset + row];
          const destRowOffset = screenSize.w * (row + screenRow * charSize.h) * 4;

          for (let col = 0; col < charSize.w; ++col) {
            const bit = (charBitsetRow >> col) & 0x1;
            const destColOffset = (col + screenCol * charSize.w) << 2;
            const color = vga256.palette[paletteRegs[bit === 1 ? fgColor : bgColor]];

            buffer[destRowOffset + destColOffset] = color.r;
            buffer[destRowOffset + destColOffset + 1] = color.g;
            buffer[destRowOffset + destColOffset + 2] = color.b;
          }
        }
      }
    }
  }
}
