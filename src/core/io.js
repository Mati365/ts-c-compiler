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
      const func = this.cpu.registers[reg],
            callback = list[func];
      if(callback)
        callback()
      else
        this.cpu.logger.error(`Unknown interrupt 0x${reg} function!`);
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

    const writeCharacter = () => {
      this.mode.write(
        this.cpu.memIO,
        this.cpu.registers.al,
        this.cpu.registers.bl,
        this.cursor.x++,
        this.cursor.y
      );
      this.updateCursor();
    };
    this.interrupts = {
      /** Graphics interrupts */
      0x10: this.intFunc('ah', {
        /** Set video mode */
        0x0: () => this.mode = BIOS.VideoMode[this.cpu.registers.al],

        /** Write character at address */
        0xE: writeCharacter,
        0x9: () => {
          for(let i = 0;i < this.cpu.registers.cx;++i)
            writeCharacter();
        }
      })
    };

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

      this.font.img.src = '../src/terminal/template/font.png';
      this.font.img.onload = () => {
        setInterval(() => {
          this.cpu.exec(1450000 / 60);
          this.redraw(this.canvas.ctx);
        }, 0);
      }
    }
  }

  /** Update cursor position */
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
    const cell = { w: 8, h: 16 };

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
