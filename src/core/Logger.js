/**
 * Simple logger
 * @class Logger
 */
export default class Logger {
  constructor() {
    (['error', 'info', 'warn', 'table', 'log']).forEach((scope) => {
      this[scope] = this.log.bind(this, scope);
    });
  }

  /**
   * Log message
   *
   * @param {String}  type  Message type
   * @param {String}  msg   Message content
   */
  log(type, msg) {
    console[type](msg);
  }
}
