type LogHandler = (type: string, msg: any) => void;

interface AbstractLogger {
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
  private silent: boolean = false;

  error(msg: any): void { this.log('error', msg); }
  info(msg: any): void { this.log('info', msg); }
  warn(msg: any): void { this.log('warn', msg); }
  table(msg: any): void { this.log('table', msg); }

  /**
   * Makes all logers silent
   *
   * @param {boolean} silent
   * @returns {Logger}
   * @memberof Logger
   */
  setSilent(silent: boolean): Logger {
    this.silent = silent;
    return this;
  }

  /**
   * Log message
   *
   * @param {String}  type  Message type
   * @param {String}  msg   Message content
   */
  /* eslint-disable no-console, class-methods-use-this */
  log(type: string, msg: any): void {
    if (this.silent)
      return;

    console[type](msg);
  }
  /* eslint-enable no-console, class-methods-use-this */
}
