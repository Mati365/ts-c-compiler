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
    this.init();
  }

  /**
   * Loads device without CPU
   */
  init() {}

  /**
   * Attach device to CPU
   *
   * @param {CPU} cpu
   */
  attach(cpu) {
    this.cpu = cpu;

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
        this.cpu.logger.error(`Unknown interrupt 0x${func.toString(16)} function!`);
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
  init() {
    this.videoMode = 0x1;
    this.cursor = {
      x: 0, y: 0, info: {
        character: '█',
        show: true,
        blink: false
      }
    };

    this.interrupts = {
      /** Graphics interrupts */
      0x10: this.intFunc('ah', {
        0x0: () => this.cpu.logger.warn('set video mode'),

        /** Write character at address */
        0xA: () => {
        }
      })
    };
  }

  /**
   * Writes character to VRAM
   *
   * @param {Number}  char  Character
   * @param {Number}  attr  Attribute
   */
  writeCharacter(char, attr) {
    this.cpu.memIO.write[0x2](
      (char & 0xFF) | (attr & 0xFF) << 8
    );
  }
}
BIOS.colorTable = {
  // 0 0000 black
  // 1 0001 blue
  // 2 0010 green
  // 3 0011 cyan
  // 4 0100 red
  // 5 0101 magenta
  // 6 0110 brown
  // 7 0111 light gray
  // 8 1000 dark gray
  // 9 1001 light blue
  // A 1010 light green
  // B 1011 light cyan
  // C 1100 light red
  // D 1101 light magenta
  // E 1110 yellow
  // F 1111 white
};

/** Exports */
module.exports = {
  BIOS
};
