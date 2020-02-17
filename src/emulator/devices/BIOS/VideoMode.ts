import {X86_REALMODE_MAPPED_ADDRESSES} from '../../constants/x86';

import {
  X86AbstractCPU,
  X86RAM,
} from '../../types';

/**
 * Creates video buffer description
 *
 * @export
 * @class VideoMode
 */
export class VideoMode {
  constructor(
    public code: number,
    public w: number,
    public h: number,
    public pages: number = 0x1,
    public offset: number = X86_REALMODE_MAPPED_ADDRESSES.text,
  ) {}

  get pageSize() {
    return this.w * this.h * 0x2;
  }

  /**
   * Memory can contain multiple pages
   *
   * @param {number} [page=0x0]
   * @returns {number}
   * @memberof VideoMode
   */
  getPageOffset(page = 0x0): number {
    return this.offset + page * this.pageSize;
  }

  /**
   * Write to VRAM
   *
   * @param {X86RAM<X86CPU>} mem
   * @param {number} char
   * @param {(number|boolean)} color
   * @param {number} x
   * @param {number} y
   * @param {number} [page=0x0]
   * @memberof VideoMode
   */
  write(
    mem: X86RAM<X86AbstractCPU>,
    char: number,
    color: number|boolean,
    x: number,
    y: number,
    page: number = 0x0,
  ): void {
    /** Write direct to memory */
    const address = this.offset + this.pageSize * page + (y * this.w + x) * 0x2;
    if (color === false)
      mem.write[0x1](char & 0xFF, address);
    else
      mem.write[0x2]((char & 0xFF) | ((<number> color & 0xFF) << 8), address);
  }

  /**
   * Read VRAM ad x, y
   *
   * @param {X86RAM<X86CPU>} mem
   * @param {number} x
   * @param {number} y
   * @param {number} [page=0x0]
   * @returns {number}
   * @memberof VideoMode
   */
  read(mem: X86RAM<X86AbstractCPU>, x: number, y: number, page: number = 0x0): number {
    const address = this.offset + this.pageSize * page + (y * this.w + x) * 0x2;

    return mem.read[0x2](address);
  }

  /**
   * Scroll window to up
   *
   * @param {X86RAM<X86AbstractCPU>} mem
   * @param {number} [lines=0x1]
   * @param {number} [page=0x0]
   * @memberof VideoMode
   */
  scrollUp(mem: X86RAM<X86AbstractCPU>, lines: number = 0x1, page: number = 0x0): void {
    const {pageSize} = this;
    const lineSize = this.w * 0x2,
      startOffset = this.offset + pageSize * page;

    /** Copy previous lines memory */
    mem.device.copy(
      mem.device,
      startOffset,
      startOffset + lineSize * lines,
      this.offset + pageSize * (page + 1),
    );

    /** Fill with zeros new line, preserve attributes! */
    for (let i = 0; i < this.w; ++i)
      this.write(mem, 0, false, i, this.h - 1, page);
  }

  /**
   * Iterate every pixel
   *
   * @param {boolean} read
   * @param {X86AbstractCPU} cpu
   * @param {number} page
   * @param {(offset: number, x: number, y: number, num: number) => void} fn
   * @memberof VideoMode
   */
  iterate(
    read: boolean,
    cpu: X86AbstractCPU,
    page: number,
    fn: (offset: number, x: number, y: number, num: number) => void,
  ) {
    const {w, h} = this;
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
   *
   * @param {X86RAM<X86AbstractCPU>} mem
   * @memberof VideoMode
   */
  clear(mem: X86RAM<X86AbstractCPU>) {
    mem.device.fill(
      0, // value
      this.offset, // offset
      this.offset + this.pages * this.pageSize,
    );
  }
}
