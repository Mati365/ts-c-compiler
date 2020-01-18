/**
 * Basic CPU device
 *
 * @class Device
 */
export default class Device {
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
