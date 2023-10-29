import { X86_REALMODE_MAPPED_ADDRESSES } from '../../constants/x86';
import { X86AbstractCPU, X86RAM } from '../../parts';

/**
 * Creates video buffer description
 */
export class VideoMode {
  constructor(
    public code: number,
    public w: number,
    public h: number,
    readonly vgaPreset: number[],
    public pages: number = 0x1,
    public offset: number = X86_REALMODE_MAPPED_ADDRESSES.text,
  ) {}

  get pageSize() {
    return this.w * this.h * 0x2;
  }

  /**
   * Memory can contain multiple pages
   */
  getPageOffset(page: number = 0x0): number {
    return this.offset + page * this.pageSize;
  }

  /**
   * Write to VRAM
   */
  write(
    mem: X86RAM<X86AbstractCPU>,
    char: number,
    color: number | boolean,
    x: number,
    y: number,
    page: number = 0x0,
  ): void {
    /** Write direct to memory */
    const address = this.offset + this.pageSize * page + (y * this.w + x) * 0x2;
    if (color === false) {
      mem.write[0x1](char & 0xff, address);
    } else {
      mem.write[0x2]((char & 0xff) | (((<number>color) & 0xff) << 8), address);
    }
  }

  /**
   * Read VRAM ad x, y
   */
  read(
    mem: X86RAM<X86AbstractCPU>,
    x: number,
    y: number,
    page: number = 0x0,
  ): number {
    const address = this.offset + this.pageSize * page + (y * this.w + x) * 0x2;

    return mem.read[0x2](address);
  }

  /**
   * Iterate every pixel
   */
  iterate(
    read: boolean,
    cpu: X86AbstractCPU,
    page: number,
    fn: (offset: number, x: number, y: number, num: number) => void,
  ) {
    const { w, h } = this;
    let offset = this.getPageOffset(page);

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        /** Read from memory */
        const num = read && cpu.memIO.read[0x2](offset);

        fn(offset, x, y, num);
        offset += 0x2;
      }
    }
  }

  /**
   * Clear VRAM
   */
  clear(mem: X86RAM<X86AbstractCPU>) {
    mem.device.fill(
      0, // value
      this.offset, // offset
      this.offset + this.pages * this.pageSize,
    );
  }
}
