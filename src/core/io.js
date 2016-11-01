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
    if(low && high)
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
  exception(code) {}

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
    for(let port in this.ports) {
      Object.defineProperty(this.cpu.ports, port, {
        get: this.ports[port]._get,
        set: this.ports[port]._set
      });
    }

    return this;
  }

  /**
   * Init interrupt function
   *
   * @param {String}  reg   Register name
   * @param {Assoc}   list  Functions callbacks
   * @returns
   */
  intFunc(reg, list) {
    return () => {
      const func = this.regs[reg],
            callback = list[func];
      if(callback)
        callback()
      else
        this.cpu.halt(`Unknown interrupt 0x${func.toString(16)} function!`);
    };
  }
}

/**
 * Basic Input Output System
 *
 * @class BIOS
 * @extends {Device}
 */
class BIOS extends Device {
  /**
   * Initialize BIOS
   *
   * @param {Canvas} canvas Canvas context
   */
  init(canvas) {
    this.mode = BIOS.VideoMode[0x3];
    this.blink = {
      last: Date.now(),
      visible: false
    };

    /** Blinking cursor */
    this.cursor = {
      x: 0, y: 0,
      w: 8, h: 16,
      info: {
        character: 219,
        attribute: (1 << 0x7) | 0x7, // enable blinking
        show: true,
        blink: false
      }
    };

    /** Canvas config */
    if(canvas) {
      this.canvas = {
        ctx: canvas.getContext('2d'),
        handle: canvas
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
          heads: 2
        }
      }
    };

    /** Clock interrupts */
    this.timer = {
      lastReset: Date.now(),
      speed: 55 /** 55MS tick */
    };
    this.interrupts = {
      /** Read System Clock (Ticks) */
      0x1A: this.intFunc('ah', {
        0x0: () => {
          const now = Date.now()
              , ticks = (this.timer.lastReset - now) / this.timer.speed;

          Object.assign(this.regs, {
            al: this.timer.lastReset - now >= 86400000 ? 0x1 : 0x0,
            dx: ticks & 0xFFFF,
            cx: (ticks >> 0x10) & 0xFFFF
          });
        }
      })
    };

    /** Initialize */
    this.initScreen();
    this.initDrive();
    this.initKeyboard();
  }

  /**
   * Init keyboard interrupts
   */
  initKeyboard() {
    Object.assign(this.interrupts, {
      /** Read (Wait for) Next Keystroke */
      0x16: this.intFunc('ah', {
        0x0: () => {
          this.cpu.pause = true;
          document.onkeypress = (e) => {
            this.cpu.pause = false;
            this.regs.al = e.keyCode;

            document.onkeypress = null;
            e.preventDefault();
          };
        }
      })
    });
  }

  /**
   * Init hard drive interrupts, buffers
   */
  initDrive() {
    Object.assign(this.interrupts, {
      0x13: this.intFunc('ah', {
        /** Reset floppy drive */
        0x0: () => {
          if(this.drives[this.regs.dl]) {
            // this.drives[this.regs.dl] = 0x0;
            this.regs.ah = this.regs.status.cf = 0x0;
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
          const cylinder = (this.regs.cx >> 6) & 0x3FF,
                sector = this.regs.cl & 0x3F,
                drive = this.drives[this.regs.dl],
                /** Mem adresses */
                src = ((cylinder * drive.info.heads + this.regs.dh) * drive.info.sectors + sector - 0x1) * drive.info.sector,
                dest = this.cpu.getMemAddress('es', 'bx');

          /** Device is init before boot, if device is null, assign boot medium */
          if(!drive.buffer)
            drive.buffer = this.cpu.device;

          if(drive.buffer) {
            /** Copy sectors */
            for(let i = 0;i < this.regs.al;++i) {
              const offset =  i * drive.info.sector;
              drive.buffer.copy(
                this.cpu.mem,
                dest + offset,                    /** Dest address */
                src + offset,                     /** Source address start */
                src + offset + drive.info.sector  /** Source address end */
              );
            }

            /** Always success, buffer is provided */
            this.regs.status.cf = 0x0;
          } else {
            /** Error */
            this.regs.status.cf = 0x1;
          }
        }
      })
    });
  }

  /**
   * Load screen interrupts, buffers
   */
  initScreen() {
    const writeCharacter = (attribute) => {
      switch(this.regs.al) {
        /** White characters */
        case 0xA:
        case 0xD:
          this.mode.write(this.cpu.memIO, 0x0, 0x0, this.cursor.x, this.cursor.y);
          if(this.regs.al == 0xD)
            this.cursor.y++;
          else
            this.cursor.x = 0;
        break;

        /** Normal characters */
        default:
          this.mode.write(
            this.cpu.memIO,
            this.regs.al,
            attribute || this.regs.bl,
            this.cursor.x,
            this.cursor.y
          );

          /** Render cursor */
          if(this.cursor.info.show) {
            this.mode.write(
              this.cpu.memIO,
              this.cursor.info.character,
              this.cursor.info.attribute,
              ++this.cursor.x,
              this.cursor.y
            );
          }
      }
    };

    Object.assign(this.interrupts, {
      /** Graphics interrupts */
      0x10: this.intFunc('ah', {
        /** Set video mode */
        0x0: () => this.setVideoMode(this.regs.al),

        /** Hide cursor */
        0x1: () => this.cursor.info.show = false,

        /** Write character at address */
        0xE: writeCharacter.bind(this, 0x7),
        0x9: () => {
          for(let i = 0;i < this.regs.cx;++i)
            writeCharacter();
        }
      })
    });

    /** Monitor render loop */
    if(this.canvas) {
      /** Font config */
      this.canvas.ctx.imageSmoothingEnabled = false;

      /** Render loop */
      let vblank = setInterval(() => {
        try {
          this.cpu.exec(1450000 / 60);
          this.redraw(this.canvas.ctx);
        } catch(e) {
          this.cpu.logger.error(e.stack);
          clearInterval(vblank);
        }
      }, 0);
    }
  }

  /**
   * Set video mode and resize canvas
   *
   * @param {Number} code  Mode code
   */
  setVideoMode(code) {
    this.mode = BIOS.VideoMode[code];

    const size = {
      width: this.mode.w * this.cursor.w,
      height: this.mode.h * this.cursor.h
    };
    Object.assign(this.canvas.handle, size);
    Object.assign(this.canvas, {
      w: size.width,
      h: size.height
    });
  }

  /**
   * Redraw whole screen
   *
   * @param {Context} ctx Screen context
   */
  redraw(ctx) {
    /** Update blinking */
    if(Date.now() - this.blink.last >= 530) {
      Object.assign(this.blink, {
        visible: !this.blink.visible,
        last: Date.now()
      });
    }

    /** Rendering from offset */
    let offset = 0;

    ctx.font = '16px Terminal';
    for(var y = 0; y < this.mode.h; ++y) {
      for(var x = 0; x < this.mode.w; ++x) {
        /** Read from memory */
        let num = this.cpu.memIO.read[0x2](this.mode.offset + offset);
        offset += 0x2;

        /** Background and text */
        ctx.fillStyle = BIOS.colorTable[(num >> 11) & 0x7];
        ctx.fillRect(x * this.cursor.w, y * (this.cursor.h + 10), this.cursor.w, this.cursor.h + 10);

        /** Foreground and text */
        if(num && (!((num >> 7) & 1) || this.blink.visible)) {
          ctx.fillStyle = BIOS.colorTable[(num >> 8) & 0xF];
          ctx.fillText(
            String.fromCharCode(BIOS.fontMapping[num & 0xFF]),
            x * this.cursor.w,
            (y + 0x1) * this.cursor.h
          );
        }
      }
    }
  }
}

/** Mapped memory */
BIOS.mapped = {
  text:   0xB8000,
  color:  0xA0000
};

/** All colors supported by BIOS */
BIOS.colorTable = {
  0x0: '#000000',
  0x1: '#0000AA',
  0x2: '#00AA00',
  0x3: '#00AAAA',
  0x4: '#AA0000',
  0x5: '#AA00AA',
  0x6: '#AA5500',
  0x7: '#AAAAAA',
  0x8: '#555555',
  0x9: '#5555FF',
  0xA: '#55FF55',
  0xB: '#55FFFF',
  0xC: '#FF5555',
  0xD: '#FF55FF',
  0xE: '#FFFF55',
  0xF: '#FFFFFF'
};

/** CP437 to Unicode conversion table */
BIOS.fontMapping = [
  0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007,
  0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x000e, 0x000f,
  0x0010, 0x0011, 0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017,
  0x0018, 0x0019, 0x001a, 0x001b, 0x001c, 0x001d, 0x001e, 0x001f,
  0x0020, 0x0021, 0x0022, 0x0023, 0x0024, 0x0025, 0x0026, 0x0027,
  0x0028, 0x0029, 0x002a, 0x002b, 0x002c, 0x002d, 0x002e, 0x002f,
  0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035, 0x0036, 0x0037,
  0x0038, 0x0039, 0x003a, 0x003b, 0x003c, 0x003d, 0x003e, 0x003f,
  0x0040, 0x0041, 0x0042, 0x0043, 0x0044, 0x0045, 0x0046, 0x0047,
  0x0048, 0x0049, 0x004a, 0x004b, 0x004c, 0x004d, 0x004e, 0x004f,
  0x0050, 0x0051, 0x0052, 0x0053, 0x0054, 0x0055, 0x0056, 0x0057,
  0x0058, 0x0059, 0x005a, 0x005b, 0x005c, 0x005d, 0x005e, 0x005f,
  0x0060, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067,
  0x0068, 0x0069, 0x006a, 0x006b, 0x006c, 0x006d, 0x006e, 0x006f,
  0x0070, 0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077,
  0x0078, 0x0079, 0x007a, 0x007b, 0x007c, 0x007d, 0x007e, 0x007f,
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7,
  0x00ea, 0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5,
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9,
  0x00ff, 0x00d6, 0x00dc, 0x00a2, 0x00a3, 0x00a5, 0x20a7, 0x0192,
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba,
  0x00bf, 0x2310, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb,
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556,
  0x2555, 0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510,
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f,
  0x255a, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567,
  0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b,
  0x256a, 0x2518, 0x250c, 0x2588, 0x2584, 0x258c, 0x2590, 0x2580,
  0x03b1, 0x00df, 0x0393, 0x03c0, 0x03a3, 0x03c3, 0x00b5, 0x03c4,
  0x03a6, 0x0398, 0x03a9, 0x03b4, 0x221e, 0x03c6, 0x03b5, 0x2229,
  0x2261, 0x00b1, 0x2265, 0x2264, 0x2320, 0x2321, 0x00f7, 0x2248,
  0x00b0, 0x2219, 0x00b7, 0x221a, 0x207f, 0x00b2, 0x25a0, 0x0020
];

/** All video modes supported by BIOS */
class VideoMode {
  constructor(w, h, pages = 0x1, offset = BIOS.mapped.text) {
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
    mem.write[0x2](
      (char & 0xFF) | ((color & 0xFF) << 8),
      this.offset + (this.w * this.h) * page + y * this.w + x
    );
  }
}

BIOS.VideoMode = {
  0x0: new VideoMode(40, 25, 0x8),
  0x3: new VideoMode(80, 25, 0x8)
};

/** Exports */
module.exports = {
  BIOS
};
