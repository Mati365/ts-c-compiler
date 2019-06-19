import {
  BIOS_COLOR_TABLE,
  CP437_UNICODE_FONT_MAPPING,
  X86_REALMODE_MAPPED_ADDRESSES,
  SCAN_CODES_TABLE,
} from './constants';

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
        callback();
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
    const address = this.offset + (this.w * this.h * 0x4) * page + y * this.w + x;
    if (color === false)
      mem.write[0x1](char & 0xFF, address);
    else
      mem.write[0x2]((char & 0xFF) | ((color & 0xFF) << 8), address);
  }

  /**
   * Scrolls screen up
   *
   * @param {Memory}  mem   Memory driver
   * @param {Number}  lines Lines amount
   * @param {Number}  page  Page index
   */
  scrollUp(mem, lines = 0x1, page = 0x0) {
    /** Line size in bytes */
    const lineSize = this.w * 0x2,
      pageSize = this.w * this.h * 0x4,
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

  clear(mem) {
    mem.device.fill(
      0, // value
      this.offset, // offset
      this.offset + this.w * this.h * 2,
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
    this.mode = BIOS.VideoMode[0x3];
    this.blink = {
      last: Date.now(),
      visible: false,
      enabled: false,
    };

    /** Blinking cursor */
    this.cursor = {
      x: 0, y: 0,
      w: 8, h: 16,
      info: {
        character: 219,
        attribute: (1 << 0x7) | 0x7, // enable blinking
        show: true,
        blink: false,
      },
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

          this.regs.ax = BIOS.keycodes[code][keymap.shift ? 1 : 0];
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
      /** Direct write to memory */
      this.mode.write(
        this.cpu.memIO,
        character,
        typeof attribute === 'undefined' ? this.regs.bl : attribute,
        this.cursor.x,
        this.cursor.y,
      );

      switch (character) {
        /** Backspace */
        case 0x8:
          this.cursor.x--;
          break;

        /** New line */
        case 0xA:
        case 0xD:
          if (character === 0xD)
            this.cursor.y++;
          else
            this.cursor.x = 0;

          /** Scroll up page, simply copy memory */
          if (this.cursor.y >= this.mode.h) {
            this.mode.scrollUp(this.cpu.memIO);
            this.cursor.y = this.mode.h - 1;
          }
          break;

        /** Normal characters */
        default:
          /** Render cursor */
          this.cursor.x++;
          if (this.cursor.x >= this.mode.w) {
            this.cursor.x = 0;
            this.cursor.y++;
          }
      }
    };

    /** Graphics interrupts */
    this.intFunc(0x10, 'ah', {
      /** Set video mode */
      0x0: () => this.setVideoMode(this.regs.al),

      /** Hide cursor */
      0x1: () => {
        this.cursor.info.show = false;
      },

      /** Cursor pos */
      0x2: () => {
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

      /**
       * Scroll screen up
       * todo: Handle cx, dx registers params
       */
      0x6: () => {
        if (!this.regs.al) {
          /** Clear screen */
          this.cpu.memIO.device.fill(
            this.regs.bh,
            this.mode.offset,
            this.mode.offset + this.mode.w * this.mode.h * 0x4,
            'utf16',
          );
        } else {
          /** Just scroll window */
          this.mode.scrollUp(
            this.cpu.memIO,
            this.regs.al,
          );
        }
      },

      /** Write character at address */
      0x9: () => {
        for (let i = 0; i < this.regs.cx; ++i)
          writeCharacter(this.regs.al);
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
        const {mode} = this;

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
    this.mode = isNaN(code) ? code : BIOS.VideoMode[code];
    this.mode.clear(this.cpu.memIO);

    /** Add toolbar 20px space */
    const size = {
      width: this.mode.w * this.cursor.w,
      height: this.mode.h * this.cursor.h + 80,
    };
    Object.assign(this.canvas.handle, size);
    Object.assign(this.canvas, {
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
    /** Update blinking */
    if (Date.now() - this.blink.last >= 530) {
      Object.assign(this.blink, {
        visible: !this.blink.visible,
        last: Date.now(),
      });
    }

    /** Rendering from offset */
    let offset = 0;

    ctx.font = `${this.cursor.h}px Terminal`;
    for (let y = 0; y < this.mode.h; ++y) {
      for (let x = 0; x < this.mode.w; ++x) {
        /** Read from memory */
        const num = this.cpu.memIO.read[0x2](this.mode.offset + offset),
          attribute = (num >> 0x8) & 0xFF;

        offset += 0x2;

        /** Foreground */
        ctx.fillStyle = BIOS.colorTable[(attribute >> 4) & 0xF];
        ctx.fillRect(x * this.cursor.w, y * this.cursor.h, this.cursor.w, this.cursor.h);

        /** Text */
        if (num && (!this.blink.enabled || this.blink.visible)) {
          ctx.fillStyle = BIOS.colorTable[attribute & 0xF];
          ctx.fillText(
            String.fromCharCode(BIOS.fontMapping[num & 0xFF]),
            x * this.cursor.w,
            (y + 0x1) * this.cursor.h - 0x4,
          );
        }
      }
    }

    /** Draw debugger toolkit */
    ctx.clearRect(0, this.canvas.h - 80, this.canvas.w, 80);

    ctx.fillStyle = BIOS.colorTable[0xF];
    ctx.fillText(
      `Virtual Machine Logs, Memory usage: ${this.cpu.memIO.device.length / 1024} KB`,
      0,
      this.canvas.h - 26,
    );

    const {registers} = this.cpu;
    ctx.fillStyle = BIOS.colorTable[0xA];
    ctx.fillText(
      `AX: ${registers.ax.toString(16)}h,  BX: ${registers.bx.toString(16)}h,  CX: ${registers.cx.toString(16)}h,  DX: ${registers.dx.toString(16)}h,  IP: ${registers.ip.toString(16)}h,  CS: ${registers.ip.toString(16)}h`,
      0,
      this.canvas.h - 6,
    );
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
