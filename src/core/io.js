import * as R from 'ramda';

import {
  BIOS_COLOR_TABLE,
  CP437_UNICODE_FONT_MAPPING,
  X86_REALMODE_MAPPED_ADDRESSES,
  SCAN_CODES_TABLE,
} from './constants';

import {getBit} from './utils/bits';

/**
 * Basic CPU device
 *
 * @class Device
 */
class Device {
  /**
   * Creates device.
   *
   * @param {Number} low    Low mem address
   * @param {Number} high   High mem address
   */
  constructor(low, high) {
    if (low && high)
      this.mem = {low, high};

    /** That maps must be initialised in attach method */
    this.interrupts = {};
    this.ports = {};
  }

  /** Return CPU registers */
  get regs() { return this.cpu.registers; }

  /**
   * Loads device without CPU
   */
  init() {}

  /**
   * Handle CPU exception
   *
   * @param {Number} code Exception code
   */
  exception() {}

  /**
   * Attach device to CPU
   *
   * @param {CPU}   cpu   CPU object
   * @param {Array} args  Initializer arguments
   */
  attach(cpu, ...args) {
    this.cpu = cpu;
    this.init.apply(this, ...args);

    Object.assign(this.cpu.interrupts, this.interrupts);
    Object.assign(this.cpu.ports, this.ports);

    return this;
  }

  /**
   * Init interrupt function
   *
   * @param {Number}  interrupt Interrupt number
   * @param {String}  reg       Register name
   * @param {Assoc}   list      Functions callbacks
   * @returns
   */
  intFunc(interrupt, reg, list) {
    this.interrupts[interrupt] = () => {
      const func = this.regs[reg],
        callback = list[func];

      if (callback)
        callback(this.regs);
      else
        this.cpu.halt(`Unknown interrupt 0x${interrupt.toString(16)} function 0x${func.toString(16)}!`);
    };
  }
}

/** All video modes supported by BIOS */
export class VideoMode {
  constructor(code, w, h, pages = 0x1, offset = X86_REALMODE_MAPPED_ADDRESSES.text) {
    this.code = code;
    this.w = w;
    this.h = h;
    this.offset = offset;
    this.pages = pages;
  }

  get pageSize() {
    return this.w * this.h * 0x2;
  }

  /**
   * Memory can contain multiple pages
   *
   * @param {number} [page=0x0]
   * @returns
   * @memberof VideoMode
   */
  getPageOffset(page = 0x0) {
    return this.offset + page * this.pageSize;
  }

  /**
   * Write to VRAM
   *
   * @param {Memory} mem    Memory driver
   * @param {Number} char   Character code
   * @param {Number} color  Color BIOS number
   * @param {Number} x      X screen coordinate
   * @param {Number} y      Y screen coordinate
   * @param {Number} page   Page index
   */
  write(mem, char, color, x, y, page = 0x0) {
    /** Multiply by each character byte size */
    x *= 0x2;
    y *= 0x2;

    /** Write direct to memory */
    const address = this.offset + this.pageSize * page + y * this.w + x;
    if (color === false)
      mem.write[0x1](char & 0xFF, address);
    else
      mem.write[0x2]((char & 0xFF) | ((color & 0xFF) << 8), address);
  }

  /**
   * Read VRAM at address
   *
   * @param {Memory} mem    Memory driver
   * @param {Number} x      X screen coordinate
   * @param {Number} y      Y screen coordinate
   * @param {Number} page   Page index
   * @returns
   * @memberof VideoMode
   */
  read(mem, x, y, page = 0x0) {
    const address = this.offset + this.pageSize * page + y * this.w + x;

    return mem.read[0x2](address);
  }

  /**
   * Scrolls screen up
   *
   * @param {Memory}  mem   Memory driver
   * @param {Number}  lines Lines amount
   * @param {Number}  page  Page index
   */
  scrollUp(mem, lines = 0x1, page = 0x0) {
    const {pageSize} = this;
    const lineSize = this.w * 0x2,
      startOffset = this.offset + pageSize * page;

    /** Copy previous lines memory */
    mem.device.copy(
      mem.device,
      startOffset,
      startOffset + lineSize,
      startOffset + pageSize - lineSize * lines,
    );

    /** Fill with zeros new line */
    mem.device.fill(
      mem.device,
      startOffset + pageSize - lineSize * lines,
      startOffset + lineSize,
    );
  }

  /**
   * Iterate every pixel
   *
   * @param {Function} fn
   * @memberof VideoMode
   */
  iterate(read, cpu, page, fn) {
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

  clear(mem) {
    mem.device.fill(
      0, // value
      this.offset, // offset
      this.offset + this.pages * this.pageSize,
    );
  }
}

/**
 * Real-Time Clock
 * ref: http://students.mimuw.edu.pl/SO/Projekt03-04/temat3-g4/cmos.html
 *
 * @class RTC
 * @extends {Device}
 */
export class RTC extends Device {
  init() {
    const date = new Date;

    this.index = 0;
    this.offsets = {
      0x0: date.getSeconds,
      0x2: date.getMinutes,
      0x4: date.getHours,
      0x6: date.getDay,
      0x7: date.getDate,
      0x8: date.getMonth,
      0x9: date.getFullYear,
    };

    this.ports = {
      0x70: {
        set: (index) => {
          this.index = index;
        },
      },
      0x71: {
        get: () => RTC.toBCD(this.offsets[this.index].call(date)),
      },
    };
  }

  /**
   * Slow method to convert each digit to binary
   *
   * @static
   * @param {Number}  num Number
   * @returns BCD encoded number
   */
  static toBCD(num) {
    const str = num.toString();
    let out = 0;

    for (let i = 0; i < str.length; ++i)
      out = (out << 4) | parseInt(str[i], 10);
    return out;
  }
}
export class Cursor {
  static Type = {
    FULL_BLOCK: 219,
    UNDERLINE: 95,
  };

  constructor(
    {
      x = 0,
      y = 0,
      w = 8,
      h = 16,
      info = {
        character: Cursor.Type.UNDERLINE,
        visible: true,
        blink: true,
      },
    } = {},
  ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.info = info;
    this.saved = [];
  }

  clone() {
    const {x, y, w, h, info} = this;

    return new Cursor(
      {
        x,
        y,
        w,
        h,
        info: R.clone(info),
      },
    );
  }

  save() {
    this.saved.push(
      this.clone(),
    );
  }

  restore() {
    const {saved} = this;
    if (!saved.length)
      return;

    Object.assign(this, saved.pop());
  }
}
/**
 * Basic Input Output System
 *
 * @class BIOS
 * @extends {Device}
 */
export class BIOS extends Device {
  /**
   * Initialize BIOS
   *
   * @param {Canvas} canvas Canvas context
   */
  init(canvas) {
    this.blink = {
      last: Date.now(),
      visible: false,
      enabled: false,
    };

    /** Blinking cursor */
    this.cursor = new Cursor;

    /** Screen */
    this.screen = {
      page: 0,
      mode: null,
    };

    /** Canvas config */
    if (canvas) {
      this.canvas = {
        ctx: canvas.getContext('2d'),
        handle: canvas,
      };

      /** 0x3 text mode is used in the most BIOS implementations */
      this.setVideoMode(0x3);
    }

    /** Drives */
    this.drives = {
      /**
       * Default boot medium is floppy called in boot()
       * x86 CPU function, DL should be:
       * 0x00h  - floppy 1 or 2
       * 0x80h  - HDD 0
       * 0x81h  - HDD 1
       */
      [this.regs.dl]: {
        buffer: null, /** it will be assigned when null to boot medium */
        track: 0,
        info: {
          /** see: https://pl.wikipedia.org/wiki/CHS */
          sector: 512,
          sectors: 18,
          heads: 2,
        },
      },
    };

    /** Clock interrupts */
    this.timer = {
      lastReset: Date.now(),
      speed: 55, /** 55MS tick */
    };

    /** Read System Clock (Ticks) */
    this.intFunc(0x1A, 'ah', {
      0x0: () => {
        const now = Date.now(),
          ticks = (this.timer.lastReset - now) / this.timer.speed;

        Object.assign(this.regs, {
          al: this.timer.lastReset - now >= 86400000 ? 0x1 : 0x0,
          dx: ticks & 0xFFFF,
          cx: (ticks >> 0x10) & 0xFFFF,
        });
      },

      /** Read Time From Real Time Clock */
      0x2: () => {
        const now = new Date();

        Object.assign(this.regs, {
          ch: RTC.toBCD(now.getHours()),
          cl: RTC.toBCD(now.getMinutes()),
          dh: RTC.toBCD(now.getSeconds()),
          dl: 0x0,
        });
        this.regs.status.cf = 0;
      },
    });

    /** Initialize */
    this.initScreen();
    this.initDrive();
    this.initKeyboard();
  }

  /**
   * Init keyboard interrupts
   */
  initKeyboard() {
    const keymap = {
      shift: false,
      key: null,
      callback: null,
    };

    document.addEventListener('keydown', (e) => {
      Object.assign(keymap, {
        shift: e.shiftKey,
        key: e.keyCode,
      });

      keymap.callback && keymap.callback(e);
    });

    document.addEventListener('keyup', () => {
      Object.assign(keymap, {
        shift: false,
        key: null,
      });
    });

    /** Pause execution until press a button */
    const keyListener = (callback) => {
      this.cpu.pause = true;
      keymap.callback = (e) => {
        this.cpu.pause = false;
        e.preventDefault();
        callback(e);
      };
    };

    this.intFunc(0x16, 'ah', {
      0x0: () => {
        keyListener((e) => {
          this.regs.al = e.keyCode;
        });
      },

      0x10: () => {
        keyListener(() => {
          const code = keymap.key;
          if (!code)
            return;

          const mapping = BIOS.keycodes[code];
          if (!mapping)
            return;

          this.regs.ax = mapping[keymap.shift ? 1 : 0];
        });
      },
    });
  }

  /**
   * Init hard drive interrupts, buffers
   */
  initDrive() {
    this.intFunc(0x13, 'ah', {
      /** Reset floppy drive */
      0x0: () => {
        if (this.drives[this.regs.dl]) {
          // this.drives[this.regs.dl] = 0x0;
          this.regs.ah = 0x0;
          this.regs.status.cf = 0x0;
        } else {
          this.regs.ah = 0x6;
          this.regs.status.cf = 0x1;
        }
      },

      /** Read from floppy drive */
      0x2: () => {
        /**
         * see: https://en.wikipedia.org/wiki/INT_13H#INT_13h_AH.3D02h:_Read_Sectors_From_Drive
         * todo: Fixme
         *
         * CX =       ---CH--- ---CL---
         * cylinder : 76543210 98
         * sector   :            543210
         */
        const cylinder = ((this.regs.cx & 0xFF00) >> 8) | (((this.regs.cx & 0xC0) << 2)),
          sector = this.regs.cl & 0x3F,
          drive = this.drives[this.regs.dl],
          /** Mem adresses */
          src = ((cylinder * drive.info.heads + this.regs.dh) * drive.info.sectors + sector - 0x1) * drive.info.sector,
          dest = this.cpu.getMemAddress('es', 'bx');

        /** Device is init before boot, if device is null, assign boot medium */
        if (!drive.buffer)
          drive.buffer = this.cpu.device;

        if (drive.buffer) {
          /** Copy sectors */
          for (let i = 0; i < this.regs.al; ++i) {
            const offset = i * drive.info.sector;
            drive.buffer.copy(
              this.cpu.mem,
              dest + offset, /** Dest address */
              src + offset, /** Source address start */
              src + offset + drive.info.sector, /** Source address end */
            );
          }

          /** Always success, buffer is provided */
          this.regs.status.cf = 0x0;
          this.regs.ah = 0x0;
        } else {
          /** Error */
          this.regs.status.cf = 0x1;
          this.regs.ah = 0xBB;
        }
      },
    });
  }

  /**
   * Load screen interrupts, buffers
   */
  initScreen() {
    const writeCharacter = (character, attribute) => {
      const {cpu, regs, cursor} = this;
      const {page, mode} = this.screen;

      switch (character) {
        /** Backspace */
        case 0x8:
          cursor.x--;
          break;

        /** New line */
        case 0xA:
        case 0xD:
          if (character === 0xA)
            cursor.y++;
          else
            cursor.x = 0;

          /** Scroll up page, simply copy memory */
          if (cursor.y >= mode.h) {
            mode.scrollUp(cpu.memIO);
            cursor.y = mode.h - 1;
          }
          break;

        /** Normal characters */
        default:
          /** Direct write to memory */
          mode.write(
            cpu.memIO,
            character,
            typeof attribute === 'undefined' ? regs.bl : attribute,
            cursor.x,
            cursor.y,
            page,
          );

          /** Render cursor */
          cursor.x++;
          if (cursor.x >= mode.w) {
            cursor.x = 0;
            cursor.y++;
          }
      }
    };

    /** Graphics interrupts */
    this.intFunc(0x10, 'ah', {
      /** Set video mode */
      0x0: () => this.setVideoMode(this.regs.al),

      /** Hide cursor */
      0x1: () => {
        /**
         * @see http://www.ablmcc.edu.hk/~scy/CIT/8086_bios_and_dos_interrupts.htm
         *
         * CX=0607h is a normal underline cursor,
         * CX=0007h is a full-block cursor.
         * CX=2607h is an invisible cursor
         * If bit 5 of CH is set, that often means "Hide cursor"
         */
        const {info} = this.cursor;
        const {cx, ch} = this.regs;

        Object.assign(
          info,
          {
            visible: !getBit(5, ch),
            character: (
              cx === 0x0607
                ? Cursor.Type.UNDERLINE
                : Cursor.Type.FULL_BLOCK
            ),
          },
        );
      },

      /** Cursor pos */
      0x2: () => {
        // todo: add ONLY active page
        Object.assign(this.cursor, {
          x: this.regs.dl,
          y: this.regs.dh,
        });
      },

      /** Get cursor position and shape */
      0x3: () => {
        Object.assign(this.regs, {
          dl: this.cursor.x,
          dh: this.cursor.y,
          ax: 0,
        });
      },

      /** Change active screen */
      0x5: () => {
        this.screen.page = this.regs.al;
      },

      /**
       * Scroll screen up
       * todo: Handle cx, dx registers params
       */
      0x6: () => {
        const {cpu, regs} = this;
        const {page, mode} = this.screen;

        if (!regs.al) {
          /** Clear screen */
          mode.iterate(false, cpu, page, (offset) => {
            cpu.memIO.write[0x2](regs.bh << 0x8, offset);
          });
        } else {
          /** Just scroll window */
          mode.scrollUp(
            cpu.memIO,
            regs.al,
            page,
          );
        }
      },

      /** Read character at cursor */
      0x8: () => {
        const {cpu, cursor, screen: {page, mode}} = this;

        this.regs.ax = mode.read(cpu.memIO, cursor.x, cursor.y, page);
      },

      /** Write character at address, do not move cursor! */
      0x9: () => {
        const {cursor} = this;

        cursor.save();
        for (let i = 0; i < this.regs.cx; ++i)
          writeCharacter(this.regs.al);
        cursor.restore();
      },

      0xE: () => writeCharacter(this.regs.al, false),

      /** Blinking */
      0x10: () => {
        if (this.regs.al !== 0x03)
          throw new Error('Unsupported 10h function!');

        if (!this.regs.bx)
          this.blink.enabled = false;
      },

      /** Extensions... */
      0x11: () => {
        /** Extend to 80x50 */
        if (this.regs.al === 0x12)
          this.setVideoMode(new VideoMode(80, 50, 0x1));
      },

      /** Write string */
      0x13: () => {
        for (let i = 0; i < this.regs.cx; ++i) {
          writeCharacter(
            this.cpu.memIO.read[0x1](this.cpu.getMemAddress('es', 'bp')),
            this.regs.al <= 0x1 && this.regs.bl,
          );
          this.regs.bp++;
        }
      },

      /**
       * Load mode columns to AH, load active mode to AL
       *
       * @see
       * http://stanislavs.org/helppc/int_10-f.html
       */
      0xF: () => {
        const {mode} = this.screen;

        this.regs.al = mode.code;
        this.regs.ah = mode.w;
      },
    });

    /** Monitor render loop */
    if (this.canvas) {
      /** Font config */
      this.canvas.ctx.imageSmoothingEnabled = false;

      /** Render loop */
      const vblank = setInterval(() => {
        try {
          this.cpu.exec(1450000 / 60);
          this.redraw(this.canvas.ctx);
        } catch (e) {
          this.cpu.logger.error(e.stack);
          clearInterval(vblank);
        }
      }, 0);
    }
  }

  /**
   * Set video mode and resize canvas
   *
   * @param {Number|Object} code  Mode
   */
  setVideoMode(code) {
    const {screen, canvas, cursor, cpu} = this;

    screen.mode = Number.isNaN(code) ? code : BIOS.VideoMode[code];
    screen.mode.clear(cpu.memIO);

    /** Add toolbar 20px space */
    const size = {
      width: screen.mode.w * cursor.w,
      height: screen.mode.h * cursor.h + 80,
    };
    Object.assign(canvas.handle, size);
    Object.assign(canvas, {
      w: size.width,
      h: size.height,
    });
  }

  /**
   * Redraw whole screen
   *
   * @param {Context} ctx Screen context
   */
  redraw(ctx) {
    const {cursor, blink, cpu, screen, canvas} = this;
    const {registers} = cpu;

    const {page, mode} = screen;

    /** Update blinking */
    if (Date.now() - blink.last >= 300) {
      Object.assign(
        blink,
        {
          visible: !blink.visible,
          last: Date.now(),
        },
      );
    }

    /** Rendering from offset */
    ctx.font = `${cursor.h}px Terminal`;
    mode.iterate(true, cpu, page, (offset, x, y, num) => {
      const attribute = (num >> 0x8) & 0xFF;

      /** Foreground */
      ctx.fillStyle = BIOS.colorTable[(attribute >> 4) & 0xF];
      ctx.fillRect(x * cursor.w, y * cursor.h, cursor.w, cursor.h);

      /** Text */
      const mapping = BIOS.fontMapping[num & 0xFF];
      if (mapping && (!blink.enabled || blink.visible)) {
        /** Todo: add support for custom palette fonts */
        ctx.fillStyle = BIOS.colorTable[attribute & 0xF];
        ctx.fillText(
          String.fromCharCode(mapping),
          x * cursor.w,
          (y + 0x1) * cursor.h - 0x4,
        );
      }
    });

    // todo: move it outside loop?
    if (cursor.info.visible && (!cursor.info.blink || blink.visible)) {
      const pageOffset = mode.getPageOffset(page);

      ctx.fillStyle = BIOS.colorTable[
        (cpu.memIO.read[0x2](pageOffset + 0x2 * cursor.x * cursor.y) >> 0x8) & 0xF
      ];

      if (cursor.info.character === Cursor.Type.UNDERLINE) {
        ctx.fillRect(
          cursor.x * cursor.w,
          (cursor.y + 0.9) * cursor.h,
          cursor.w,
          2,
        );
      } else {
        ctx.fillText(
          String.fromCharCode(cursor.info.character),
          cursor.x * cursor.w,
          (cursor.y + 0x1) * cursor.h - 0x4,
        );
      }
    }

    /** Draw debugger toolkit */
    ctx.clearRect(0, canvas.h - 80, canvas.w, 80);

    ctx.fillStyle = BIOS.colorTable[0xF];
    ctx.fillText(
      `Virtual Machine Logs, Memory usage: ${cpu.memIO.device.length / 1024} KB`,
      0,
      canvas.h - 26,
    );

    /* eslint-disable max-len */
    ctx.fillStyle = BIOS.colorTable[0xA];
    ctx.fillText(
      `AX: ${registers.ax.toString(16)}h,  BX: ${registers.bx.toString(16)}h,  CX: ${registers.cx.toString(16)}h,  DX: ${registers.dx.toString(16)}h,  IP: ${registers.ip.toString(16)}h,  CS: ${registers.ip.toString(16)}h`,
      0,
      canvas.h - 6,
    );
    /* eslint-enable max-len */
  }
}

/** Mapped memory */
BIOS.mapped = X86_REALMODE_MAPPED_ADDRESSES;

/** All colors supported by BIOS */
BIOS.colorTable = BIOS_COLOR_TABLE;

/** CP437 to Unicode conversion table */
BIOS.fontMapping = CP437_UNICODE_FONT_MAPPING;

/** ref: http://stanislavs.org/helppc/scan_codes.html */
BIOS.keycodes = SCAN_CODES_TABLE;

BIOS.VideoMode = {
  0x0: new VideoMode(0x0, 40, 25, 0x8),
  0x3: new VideoMode(0x3, 80, 25, 0x8),
};
