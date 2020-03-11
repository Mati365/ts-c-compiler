import {format} from '../utils/format';

/**
 * Errors thrown during compiling
 *
 * @export
 * @class CompilerError
 * @extends {Error}
 * @template CodeType
 * @template LocType
 */
export class CompilerError<CodeType = any, LocType = any> extends Error {
  constructor(
    public readonly translations: object,
    public readonly code: CodeType,
    public readonly loc?: LocType,
    public readonly meta?: object,
  ) {
    super();

    this.name = 'Compiler';
    this.message = format(
      this.translations[<any> code],
      meta || {},
    );
  }

  /**
   * Returns log with location if provided
   *
   * @returns {string}
   * @memberof CompilerError
   */
  getCompilerMessage(): string {
    const {loc, message, name} = this;
    if (!loc)
      return message;

    return `(${loc.toString()}): <${name}> ${message}`;
  }
}
