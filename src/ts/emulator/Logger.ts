type LogHandler = (type: string, msg: any) => void;

type AbstractLogger = {
  log: LogHandler;
  warn?: LogHandler;
  error?: LogHandler;
  info?: LogHandler;
  table?: LogHandler;
}

/**
 * Simple logger that uses javascript output console
 *
 * @todo
 *  Add output stream support for external GUI loggers
 *
 * @export
 * @class Logger
 * @implements {AbstractLogger}
 */
export class Logger implements AbstractLogger {
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
  /* eslint-disable class-methods-use-this */
  log(type: string, msg: any): void {
    console[type](msg);
  }
  /* eslint-enable class-methods-use-this */
}
