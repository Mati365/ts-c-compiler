import {MemoryRegionRange, MemoryRegionsMap} from '@emulator/x86-cpu/memory/MemoryRegion';
import {Size} from '@compiler/core/types';

export const VGA_BANK_SIZE = 0x10000;
export const VGA_TOTAL_PLANES = 0x4;
export const VGA_PIXEL_MEM_MAP = Object.freeze(
  new MemoryRegionRange(
    VGA_BANK_SIZE * VGA_TOTAL_PLANES,
    VGA_BANK_SIZE * (VGA_TOTAL_PLANES + 0x8),
  ),
);
export const VGA_BUFFER_SIZE = VGA_PIXEL_MEM_MAP.high;
export const VGA_CHARSET_BANK_SIZE = 0x4000;
export const VGA_CHARSET_SIZE = 256;
export const VGA_CHAR_BYTE_SIZE = 32;

export const GRAPHICS_MEMORY_MAPS: MemoryRegionsMap = Object.freeze(
  {
    0b00: new MemoryRegionRange(0xA0000, 0xBFFFF), // 128K region
    0b01: new MemoryRegionRange(0xA0000, 0xAFFFF), // 64K region
    0b10: new MemoryRegionRange(0xB0000, 0xB7FFF), // 32K region
    0b11: new MemoryRegionRange(0xB8000, 0xBFFFF), // 32K region
  },
);

export const CHARSET_MEMORY_MAPS: MemoryRegionsMap = Object.freeze(
  {
    0b000: new MemoryRegionRange(0x0000, 0x1FFF),
    0b001: new MemoryRegionRange(0x4000, 0x5FFF),
    0b010: new MemoryRegionRange(0x8000, 0x9FFF),
    0b011: new MemoryRegionRange(0xC000, 0xDFFF),
    0b100: new MemoryRegionRange(0x2000, 0x3FFF),
    0b101: new MemoryRegionRange(0x6000, 0x7FFF),
    0b110: new MemoryRegionRange(0xA000, 0xBFFF),
    0b111: new MemoryRegionRange(0xE000, 0xFFFF),
  },
);

/**
 * Graphics ALU processing mode
 *
 * @export
 * @enum {number}
 */
export enum GraphicsWriteMode {
  MODE_0 = 0b00,
  MODE_1 = 0b01,
  MODE_2 = 0b10,
  MODE_3 = 0b11,
}

/**
 * 00b - Result is input from previous stage unmodified.
 * 01b - Result is input from previous stage logical ANDed with latch register.
 * 10b - Result is input from previous stage logical ORed with latch register.
 * 11b - Result is input from previous stage logical XORed with latch register.
 */
export const GRAPHICS_ALU_OPS: Record<GraphicsWriteMode, (a: number, b?: number) => number> = {
  [GraphicsWriteMode.MODE_0]: (a: number) => a,
  [GraphicsWriteMode.MODE_1]: (a: number, b: number) => a & b,
  [GraphicsWriteMode.MODE_2]: (a: number, b: number) => a | b,
  [GraphicsWriteMode.MODE_3]: (a: number, b: number) => a ^ b,
};

/**
 * Field used to faster matching if address is in VGA mem map,
 * it is generally faster than accessing getters and doing some
 * logic operaitons
 */
export const GRAPHICS_RESERVED_MEM_MAP = Object.freeze(
  new MemoryRegionRange(0xA0000, 0xBFFFF),
);

/**
 * Holds binary represenation of font
 *
 * @export
 * @class VGAFontPack
 */
export class VGAFontPack {
  constructor(
    public readonly charSize: Size,
    public readonly data: number[],
  ) {}
}
