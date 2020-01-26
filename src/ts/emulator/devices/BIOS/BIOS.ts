import {
  BIOS_COLOR_TABLE,
  CP437_UNICODE_FONT_MAPPING,
  X86_REALMODE_MAPPED_ADDRESSES,
  SCAN_CODES_TABLE,
  AT2_SCAN_CODES_QWERTY,
} from '../../constants/x86';

import {uuidX86Device} from '../../types/X86AbstractDevice';
import {X86CPU} from '../../X86CPU';
import {getBit} from '../../utils/bits';

import {CursorCharacter, Cursor} from '../Cursor';
import {VideoMode} from './VideoMode';

type KeymapTable = {
  [keycode: number]: number[],
};

type CursorBlinkState = {
  last: number,
  visible?: boolean,
  enabled?: boolean,
};

type ScreenState = {
  page: number,
  mode: VideoMode,
};

type BIOSCanvas = {
  ctx: CanvasRenderingContext2D,
  handle: HTMLCanvasElement,
};

type BIOSInitConfig = {
  canvas: HTMLCanvasElement
};

type BIOSFloppyDrive = {
  buffer: Buffer,
  track: number,
  info: {
    sector: number,
    sectors: number,
    heads: number,
  },
};

/**
 * Basic Input Output System
 *
 * @class BIOS
 * @extends {Device}
 */
export class BIOS extends uuidX86Device<X86CPU, BIOSInitConfig>('bios') {
  /** Mapped memory */
  static mapped = X86_REALMODE_MAPPED_ADDRESSES;

  /** All colors supported by BIOS */
  static colorTable = BIOS_COLOR_TABLE;

  /** CP437 to Unicode conversion table */
  static fontMapping = CP437_UNICODE_FONT_MAPPING;

  static VideoMode = {
    0x0: new VideoMode(0x0, 40, 25, 0x8),
    0x3: new VideoMode(0x3, 80, 25, 0x8),
  };

  private cursor = new Cursor;

  private blink: CursorBlinkState = {
    last: Date.now(),
    visible: false,
    enabled: false,
  };

  private screen: ScreenState = {
    page: 0,
    mode: null,
  };

  private canvas: BIOSCanvas;

  private drives: {[drive: number]: BIOSFloppyDrive} = null;

  /**
   * Initialize BIOS
   *
   * @param {Canvas} canvas Canvas context
   */
  init({canvas}: BIOSInitConfig): void {
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

    /** Initialize */
    this.initScreen();
    this.initDrive();
    this.initKeyboard();
    this.initServices();
  }

  /**
   * Init bios services
   *
   * @see {@link http://stanislavs.org/helppc/int_15.html}
   *
   * @memberof BIOS
   */
  initServices() {
    this.attachInterrupts(0x15, 'ah', {
      /**
       * Wait in microseconds
       * @see {@link http://stanislavs.org/helppc/int_15-86.html}
       */
      0x86: () => {
        const {cpu} = this;
        const {cx, dx, status} = this.regs;

        const miliseconds = (((cx << 0xF) | dx) / 1000) * 2;
        if (miliseconds < 2)
          return;

        status.cf = 1;
        cpu.pause = true;

        setTimeout(
          () => {
            status.cf = 0;
            cpu.pause = false;
          },
          miliseconds,
        );
      },
    });
  }

  /**
   * Init keyboard interrupts
   *
   * @see {@link http://stanislavs.org/helppc/int_16.html}
   */
  initKeyboard() {
    const keymap = {
      shift: false,
      key: null,
      callback: null,
    };

    const clearKeyBuffer = (clearCallback = true) => {
      Object.assign(
        keymap,
        {
          shift: false,
          key: null,
          callback: clearCallback ? null : keymap.callback,
        },
      );
    };

    document.addEventListener('keydown', (e) => {
      Object.assign(
        keymap,
        {
          shift: e.shiftKey,
          key: e.keyCode,
        },
      );

      // eslint-disable-next-line no-unused-expressions
      keymap.callback?.(e);
    });

    document.addEventListener('keyup', () => clearKeyBuffer(false));

    /**
     * Pause execution until press a button
     * but if user already is pressing button - do not pause
     */
    const keyListener = (callback) => {
      if (keymap.key === null) {
        this.cpu.pause = true;
        keymap.callback = (e) => {
          e.preventDefault();

          callback(keymap.key);
          clearKeyBuffer();

          this.cpu.pause = false;
        };
      } else {
        callback(keymap.key);
        clearKeyBuffer();
      }
    };

    /**
     * Reads keycode and assigns variable to AX
     *
     * @todo
     *  Add better support for extened keyboards (see broken arrows)
     */
    const readKeyState = (keymapTable?: KeymapTable, code: number = keymap.key) => {
      this.regs.ax = 0x0;

      if (!code)
        return false;

      const mapping = (keymapTable || SCAN_CODES_TABLE)[code];
      if (!mapping)
        return false;

      this.regs.ax = mapping[Math.min(mapping.length - 1, keymap.shift ? 1 : 0)];
      return true;
    };

    this.attachInterrupts(0x16, 'ah', {
      /* Wait for keystroke and read */
      0x0: () => {
        // it was used from 0x10, is it ok? maybe use separate array for extended keys?
        keyListener(
          (code: number) => readKeyState(null, code),
        );
      },

      /* Get Keyboard Status */
      0x1: () => {
        const {regs} = this;
        const status = readKeyState();

        regs.status.zf = (+status) ^ 1; // 0 if character is available
      },

      /* Wait for keystroke and read, AT, PS/2 */
      0x10: () => {
        keyListener(
          // todo: add release keycodes also
          (code: number) => readKeyState(AT2_SCAN_CODES_QWERTY.PRESSED, code),
        );
      },
    });
  }

  /**
   * Init hard drive interrupts, buffers
   */
  initDrive() {
    this.attachInterrupts(0x13, 'ah', {
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
    const writeCharacter = (
      character: number,
      attribute: number,
      color: number|boolean = true,
    ): void => {
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
            color && (typeof attribute === 'undefined' ? regs.bl : attribute),
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

    const writeCharacters = (
      attribute?: number,
      color: number|boolean = true,
      moveCursor: boolean = false,
    ): void => {
      const {cursor} = this;

      if (!moveCursor)
        cursor.save();

      for (let i = 0; i < this.regs.cx; ++i)
        writeCharacter(this.regs.al, attribute, color);

      if (!moveCursor)
        cursor.restore();
    };

    /** Graphics interrupts */
    this.attachInterrupts(0x10, 'ah', {
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
                ? CursorCharacter.UNDERLINE
                : CursorCharacter.FULL_BLOCK
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
        const {cpu, cursor, screen: {mode}} = this;

        this.regs.ax = mode.read(cpu.memIO, cursor.x, cursor.y, this.regs.bh);
      },

      /** Write character at address, do not move cursor! */
      0x9: () => {
        writeCharacters();
      },

      0xA: () => {
        writeCharacters(null, false);
      },

      0xE: () => writeCharacter(this.regs.al, undefined),

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
          this.cpu.exec(1450000 / 30);
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

      if (cursor.info.character === CursorCharacter.UNDERLINE) {
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
    ctx.clearRect(0, canvas.handle.height - 80, canvas.handle.width, 80);

    ctx.fillStyle = BIOS.colorTable[0xF]; // eslint-disable-line prefer-destructuring
    ctx.fillText(
      `Virtual Machine Logs, Memory usage: ${cpu.memIO.device.length / 1024} KB`,
      0,
      canvas.handle.height - 26,
    );

    /* eslint-disable max-len */
    ctx.fillStyle = BIOS.colorTable[0xA]; // eslint-disable-line prefer-destructuring
    ctx.fillText(
      `AX: ${registers.ax.toString(16)}h,  BX: ${registers.bx.toString(16)}h,  CX: ${registers.cx.toString(16)}h,  DX: ${registers.dx.toString(16)}h,  IP: ${registers.ip.toString(16)}h,  CS: ${registers.ip.toString(16)}h`,
      0,
      canvas.handle.height - 6,
    );
    /* eslint-enable max-len */
  }
}
