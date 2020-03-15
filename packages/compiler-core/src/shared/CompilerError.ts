import {format} from '../utils/format';

/**
 * Errors thrown during compiling
 *
 * @export
 * @class CompilerError
 * @extends {Error}
 * @template C CodeType
 * @template L LocationType
 */
export class CompilerError<C = any, L = any> extends Error {
  constructor(
    public readonly translations: object,
    public readonly code: C,
    public readonly loc?: L,
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
