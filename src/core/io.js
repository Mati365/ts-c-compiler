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
    this.mode = BIOS.VideoMode[0x0];
    this.canvas = {
      w: canvas.clientWidth,
      h: canvas.clientHeight,
      ctx: canvas.getContext('2d')
    }

    this.cursor = {
      x: 0, y: 0, info: {
        character: '█',
        show: true,
        blink: false
      }
    };

    this.interrupts = {
      /** Graphics interrupts */
      10: this.intFunc('ah', {
        /** Set video mode */
        0x0: () => this.mode = BIOS.VideoMode[this.cpu.registers.al],

        /** Write character at address */
        0x9: () => {
          this.mode.write(
            this.cpu.memIO,
            this.cpu.registers.al,
            this.cpu.registers.bl,
            this.cursor.x,
            this.cursor.y
          );
        }
      })
    };

    /** Monitor render loop */
    this.canvas.ctx.imageSmoothingEnabled = false;
    setInterval(
      this.redraw.bind(this, this.canvas.ctx),
      1000 / 10
    );
  }

  /**
   * Redraw whole screen
   *
   * @param {Context} ctx Screen context
   */
  redraw(ctx) {
    const cell = {
      w: this.canvas.w / this.mode.w,
      h: this.canvas.h / this.mode.h
    };

    ctx.clearRect(0, 0, this.canvas.w, this.canvas.h);
    ctx.font = `${cell.h}px Terminal`;

    let offset = 0;
    for(var y = 0;y < this.mode.h;++y) {
      for(var x = 0;x < this.mode.w;++x) {
        let [char, color] = [
          this.cpu.mem[this.mode.offset + (offset++)],
          this.cpu.mem[this.mode.offset + (offset++)]
        ]
        ctx.fillStyle = BIOS.colorTable[color];
        ctx.fillText(String.fromCharCode(char), (x + 1) * cell.w, (y + 1) * cell.h);
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
