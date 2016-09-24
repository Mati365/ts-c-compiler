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

    /** Canvas config */
    if(canvas) {
      this.canvas = {
        w: canvas.clientWidth,
        h: canvas.clientHeight,
        ctx: canvas.getContext('2d')
      }
    }

    /** Blinking cursor */
    this.cursor = {
      x: 0, y: 0,
      info: {
        character: 219,
        attribute: (1 << 0x7) | 0x7, // enable blinking
        show: true,
        blink: false
      }
    };

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
          sectors: 64,
          heads: 16,
          cylinders: 1024
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
            this.drives[this.regs.dl] = 0x0;
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
                src = (this.regs.dh * drive.info.cylinders + cylinder) * drive.info.sectors * drive.info.sector + (sector - 0x1) * drive.info.sector,
                dest = this.cpu.getMemAddress('es', 'bx');

          /** Device is init before boot, if device is null, assign boot medium */
          if(!drive.buffer)
            drive.buffer = this.cpu.device;

          /** Copy sectors */
          for(let i = 0;i < this.regs.al;++i) {
            const offset =  i * drive.info.sector;
            drive.buffer.copy(
              this.cpu.mem,
              dest + offset,  /** Dest address */
              src + offset,                     /** Source address start */
              src + offset + drive.info.sector  /** Source address end */
            );
          }
        }
      })
    });
  }

  /**
   * Load screen interrupts, buffers
   */
  initScreen() {
    const writeCharacter = () => {
      this.mode.write(
        this.cpu.memIO,
        this.regs.al,
        this.regs.bl,
        this.cursor.x++,
        this.cursor.y
      );
      this.updateCursor();
    };

    Object.assign(this.interrupts, {
      /** Graphics interrupts */
      0x10: this.intFunc('ah', {
        /** Set video mode */
        0x0: () => this.mode = BIOS.VideoMode[this.regs.al],

        /** Write character at address */
        0xE: writeCharacter,
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
      this.font = {
        buffer: document.createElement('canvas'),
        ctx: null,
        img: new Image,
        w: 8,
        h: 16
      };

      /** Init offscreen character buffer */
      let buffer = this.font.buffer;
      buffer.width = this.font.w;
      buffer.height = this.font.h;
      this.font.ctx = buffer.getContext('2d');

      /** Render loop */
      this.font.img.src = '../src/terminal/template/font.png';
      this.font.img.onload = () => {
        let vblank = setInterval(() => {
          try {
            this.cpu.exec(1450000 / 60);
            this.redraw(this.canvas.ctx);
          } catch(e) {
            this.cpu.logger.error(e);
            clearInterval(vblank);
          }
        }, 0);
      }
    }
  }

  /**
   * Update cursor position
   */
  updateCursor() {
    this.mode.write(
      this.cpu.memIO,
      this.cursor.info.character,
      this.cursor.info.attribute,
      this.cursor.x,
      this.cursor.y
    );
  }

  /**
   * Draw character on screen
   *
   * @param {Context} ctx   Terminal canvas context
   * @param {Number}  char  Character code
   * @param {Number}  x     Column
   * @param {Number}  y     Row
   * @param {Number}  w     Character width
   * @param {Number}  h     Character height
   * @param {String}  hex   Character foreground
   */
  drawChar(ctx, char, x, y, w, h, hex) {
    let _ctx = this.font.ctx;

    _ctx.save();
    _ctx.clearRect(0, 0, this.font.w, this.font.h);
    _ctx.drawImage(
      this.font.img,
      (char % 32) * this.font.w,
      Math.floor(char / 32) * this.font.h,
      this.font.w, this.font.h,
      0, 0,
      this.font.w, this.font.h
    );
    _ctx.fillStyle = hex;
    _ctx.globalCompositeOperation = 'source-in';
    _ctx.fillRect(0, 0, this.font.w, this.font.h);
    _ctx.restore();

    ctx.drawImage(this.font.buffer, 0, 0, this.font.w, this.font.h, x, y, w, h);
  }

  /**
   * Redraw whole screen
   *
   * @param {Context} ctx Screen context
   */
  redraw(ctx) {
    const cell = { w: 9, h: 18 };

    /** Update blinking */
    if(Date.now() - this.blink.last >= 530) {
      Object.assign(this.blink, {
        visible: !this.blink.visible,
        last: Date.now()
      });
    }

    /** Rendering from offset */
    let offset = 0;
    for(var y = 0; y < this.mode.h; ++y) {
      for(var x = 0; x < this.mode.w; ++x) {
        /** Read from memory */
        let num = this.cpu.memIO.read[0x2](this.mode.offset + offset);
        offset += 0x2;

        /** Background and text */
        ctx.fillStyle = BIOS.colorTable[(num >> 11) & 0x7];
        ctx.fillRect(x * cell.w, y * cell.h, cell.w, cell.h);

        /** Foreground and text */
        if(num && (!((num >> 7) & 1) || this.blink.visible)) {
          this.drawChar(
            ctx,
            num & 0xFF,
            x * cell.w, y * cell.h,
            cell.w, cell.h,
            BIOS.colorTable[(num >> 8) & 0xF]
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
