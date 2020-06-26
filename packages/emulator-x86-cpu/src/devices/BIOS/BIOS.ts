import {getBit} from '@compiler/core/utils/bits';
import {Vec2D} from '@compiler/core/types';
import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';

import {VGA_CURSOR_SHAPES} from '../Video/VGAConstants';
import {
  BIOS_COLOR_TABLE,
  CP437_UNICODE_FONT_MAPPING,
  SCAN_CODES_TABLE,
  AT2_SCAN_CODES_QWERTY,
  X86_MAPPED_VM_MEM,
  X86_REALMODE_MAPPED_ADDRESSES,
} from '../../constants/x86';

import {uuidX86Device} from '../../types/X86AbstractDevice';
import {X86CPU} from '../../X86CPU';

import {VideoMode} from './VideoMode';
import {VGA} from '../Video/VGA';
import {
  VGA_TEXT_MODES_PRESET,
  VGA_GRAPHICS_MODES_PRESET,
} from '../Video/VGAModesPresets';

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

type BIOSInitConfig = {
  screenElement: HTMLElement,
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

class BIOSKeyboardFlags extends UnionStruct {
  @bits(0) rightShiftDepressed: number;
  @bits(1) leftShiftDepressed: number;
  @bits(2) ctrlDepressed: number;
  @bits(3) altDepressed: number;
  @bits(4) scrollLockActive: number;
  @bits(5) numLockActive: number;
  @bits(6) capsLockActive: number;
  @bits(7) insertActive: number;
}

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
    0x0: new VideoMode(0x0, 40, 25, VGA_TEXT_MODES_PRESET['40x25'], 0x8),
    0x2: new VideoMode(0x2, 80, 25, VGA_TEXT_MODES_PRESET['80x25'], 0x8),
    0x3: new VideoMode(0x3, 80, 25, VGA_TEXT_MODES_PRESET['80x25'], 0x8),
    0x4: new VideoMode(0x4, 320, 200, VGA_GRAPHICS_MODES_PRESET['320x200x4'], 0x1),
    0x11: new VideoMode(0x11, 640, 480, VGA_GRAPHICS_MODES_PRESET['640x200x2'], 0x1),
    0x12: new VideoMode(0x12, 640, 480, VGA_GRAPHICS_MODES_PRESET['640x200x16'], 0x1),
    0x13: new VideoMode(0x13, 320, 200, VGA_GRAPHICS_MODES_PRESET['320x200x256'], 0x1),
  };

  private blink: CursorBlinkState = {
    last: Date.now(),
    visible: false,
    enabled: false,
  };

  private screen: ScreenState = {
    page: 0,
    mode: null,
  };

  private screenElement: HTMLElement;

  private drives: {[drive: number]: BIOSFloppyDrive} = null;

  /**
   * Creates an instance of BIOS.
   *
   * @memberof BIOS
   */
  constructor() {
    super(X86_MAPPED_VM_MEM);
  }

  get vga(): VGA {
    return <VGA> this.cpu.devices.vga;
  }

  /**
   * Initialize BIOS
   *
   * @param {Canvas} canvas Canvas context
   */
  init({screenElement}: BIOSInitConfig): void {
    /** Canvas config */
    if (screenElement) {
      /** 0x3 text mode is used in the most BIOS implementations */
      this.screenElement = screenElement;
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
      caps: false,
      ctrl: false,
      alt: false,
      shift: false,
      key: null,
      callback: null,
    };

    const clearKeyBuffer = (clearCallback = true) => {
      Object.assign(
        keymap,
        {
          caps: false,
          alt: false,
          ctrl: false,
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
          caps: e.getModifierState('CapsLock'),
          alt: e.altKey,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          key: e.keyCode,
        },
      );

      // eslint-disable-next-line no-unused-expressions
      keymap.callback?.(e);
    });

    document.addEventListener('keyup', () => clearKeyBuffer(false));

    /**
     * Returns false if user pressed shift
     */
    const isCaseModifyKeycode = (code: number): boolean => code > 18 || code < 16;

    /**
     * Pause execution until press a button
     * but if user already is pressing button - do not pause
     */
    const keyListener = (callback: (key: any) => void) => {
      const {cpu} = this;

      if (keymap.key === null) {
        cpu.pause = true;
        keymap.callback = (e: KeyboardEvent): void => {
          e.preventDefault();

          if (isCaseModifyKeycode(keymap.key)) {
            callback(keymap.key);
            clearKeyBuffer();
            cpu.pause = false;
          }
        };
      } else if (isCaseModifyKeycode(keymap.key)) {
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
      const {regs} = this;

      regs.ax = 0x0;

      if (!code)
        return false;

      const mapping = (keymapTable || SCAN_CODES_TABLE)[code];
      if (!mapping)
        return false;

      regs.ax = mapping[Math.min(mapping.length - 1, keymap.shift ? 1 : 0)];
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

      /* Get keyboard flags */
      0x2: () => {
        const {regs} = this;
        const flags = new BIOSKeyboardFlags;

        flags.capsLockActive = +keymap.caps;
        flags.ctrlDepressed = +keymap.ctrl;
        flags.altDepressed = +keymap.alt;
        flags.leftShiftDepressed = +keymap.shift;
        flags.rightShiftDepressed = +keymap.shift;

        regs.al = flags.number;
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
   *
   * @memberof BIOS
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
   * Loads exec vblank
   *
   * @memberof BIOS
   */
  initScreen() {
    const writeCharacter = (
      character: number,
      attribute?: number,
      color: number|boolean = true,
      moveCursor?: boolean,
      cursor: Vec2D = this.vga.getTextCursorLocation(),
    ): void => {
      const {cpu, regs, vga} = this;
      const {page, mode} = this.screen;

      /** todo: check bahaviour */
      if (!vga.textMode)
        return;

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
            vga.scrollTextUp();
            cursor.y = mode.h - 1;
          }
          break;

        /** Normal characters */
        default:
          /** Direct write to memory */
          mode.write(
            cpu.memIO,
            character,
            (color && (typeof attribute === 'undefined' ? regs.bl : attribute)) || 0b111,
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

      if (moveCursor)
        vga.setCursorLocation(cursor);
    };

    const writeCharacters = (
      attribute?: number,
      color: number|boolean = true,
      moveCursor: boolean = false,
    ): void => {
      const {regs, vga} = this;
      const {al, cx} = regs;

      const cachedCursor = vga.getTextCursorLocation();
      for (let i = 0; i < cx; ++i)
        writeCharacter(al, attribute, color, moveCursor, cachedCursor);
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
        const {vga} = this;
        const {ch, cx} = this.regs;

        vga.crtcRegs.setTextCursorDisabled(getBit(5, ch));
        vga.crtcRegs.setTextCursorShape(
          cx === 0x0607
            ? VGA_CURSOR_SHAPES.UNDERLINE
            : VGA_CURSOR_SHAPES.FULL_BLOCK,
        );
      },

      /** Cursor pos */
      0x2: () => {
        // todo: add ONLY active page
        const {dl, dh} = this.regs;

        this.vga.setCursorLocation(
          new Vec2D(dl, dh),
        );
      },

      /** Get cursor position and shape */
      0x3: () => {
        const cursor = this.vga.getTextCursorLocation();

        Object.assign(
          this.regs,
          {
            dl: cursor.x,
            dh: cursor.y,
            ax: 0,
          },
        );
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
        const {cpu, regs, vga} = this;
        const {page, mode} = this.screen;

        if (!regs.al) {
          /** Clear screen */
          mode.iterate(false, cpu, page, (offset) => {
            cpu.memIO.write[0x2](regs.bh << 0x8, offset);
          });
        } else {
          /** Just scroll window */
          vga.scrollTextUp(regs.al, page);
        }
      },

      /** Read character at cursor */
      0x8: () => {
        const {cpu, regs, vga, screen: {mode}} = this;
        const cursor = vga.getTextCursorLocation();

        regs.ax = mode.read(cpu.memIO, cursor.x, cursor.y, regs.bh);
      },

      /** Write character at address, do not move cursor! */
      0x9: () => {
        writeCharacters();
      },

      0xA: () => {
        writeCharacters(null, false);
      },

      0xE: () => writeCharacter(this.regs.al, null, false, true),

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
          this.setVideoMode(new VideoMode(0x12, 80, 50, VGA_TEXT_MODES_PRESET['80x50'], 0x1));
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
    const {screenElement, cpu} = this;
    if (screenElement) {
      /** Render loop */
      const vga = <VGA> cpu.devices.vga;
      vga.setScreenElement(screenElement);

      const frame = () => {
        try {
          cpu.exec(15);
          this.redraw();

          if (!cpu.isHalted())
            requestAnimationFrame(frame);
        } catch (e) {
          cpu.logger.error(e.stack);
        }
      };

      requestAnimationFrame(frame);
    }
  }

  private frameNumber: number = 0;

  redraw(): void {
    const {vga} = this;

    vga
      .getCurrentRenderer()
      .redraw(this.frameNumber);

    this.frameNumber = (this.frameNumber + 1) % 0x30;
  }

  /**
   * Set video mode
   *
   * @param {Number|Object} code  Mode
   */
  setVideoMode(code: number|VideoMode): void {
    const {screen, vga} = this;

    screen.mode = Number.isNaN(<number> code) ? code : BIOS.VideoMode[<number> code];
    vga.loadModePreset(screen.mode.vgaPreset);
  }
}
